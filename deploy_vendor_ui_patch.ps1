<#
.SYNOPSIS
    Vendor UI Only Deployment Script.
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root",
    [string]$RemoteBasePath = "/var/www/html"
)

# Configuration
$Paths = @{
    "Vendor" = @{
        "LocalSource" = "$PSScriptRoot/client-vendor/dist"
        "DistDir"     = "." 
        "RemotePath"  = "$RemoteBasePath/stagingvendor.resortwala.com"
        "Type"        = "React"
    }
}

function Deploy-Component {
    param ($Name, $Config)
    
    $SourcePath = Join-Path $Config.LocalSource $Config.DistDir
    
    Write-Host "[$Name] Initializing Deployment..." -ForegroundColor Cyan

    # Check if dist exists, if not warn user
    if (-not (Test-Path $SourcePath)) {
        Write-Error "[$Name] Build folder not found at $SourcePath. Please run 'npm run build' first."
        return
    }
    
    # 2. Compress (Tar Gzip for Linux Compatibility)
    $TarFileName = "deploy_package_vendor_ui.tar.gz"
    $TarPath = ".\$TarFileName"
    
    if (Test-Path $TarPath) { Remove-Item $TarPath -Force }
    
    Write-Host "[$Name] Compressing (tar.gz)..." -ForegroundColor Yellow
    
    tar -czf "$TarPath" -C "$SourcePath" .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[$Name] Compression Failed."
        return
    }

    # 4. Transfer
    Write-Host "[$Name] Uploading..." -ForegroundColor Cyan
    
    $AbsTarPath = (Resolve-Path $TarPath).Path
    scp -o StrictHostKeyChecking=no "$AbsTarPath" "${User}@${ServerIP}:$($Config.RemotePath)/$TarFileName"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$Name] Extracting..." -ForegroundColor Green
        
        # 5. Extract Remotely (Linux)
        $RemoteExtractCmd = "tar -xzf $($Config.RemotePath)/$TarFileName -C $($Config.RemotePath) && rm $($Config.RemotePath)/$TarFileName"
        
        ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteExtractCmd"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$Name] SUCCESS." -ForegroundColor Green
        }
        else {
            Write-Host "[$Name] Extraction Failed." -ForegroundColor Red
        }
    }
    else {
        Write-Error "[$Name] SCP Upload Failed."
    }
    
    # Cleanup local
    if (Test-Path $TarPath) { Remove-Item $TarPath -Force }
}

# --- DIRECT EXECUTION ---
Write-Host "Starting Vendor UI Patch Deployment..." -ForegroundColor Magenta
Deploy-Component "Vendor" $Paths.Vendor
