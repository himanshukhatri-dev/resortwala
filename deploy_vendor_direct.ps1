<#
.SYNOPSIS
    Direct Deployment script for Vendor App (Generated Patch).
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root",
    [string]$RemoteBasePath = "/var/www/html"
)

# Configuration
$Paths = @{
    "Customer" = @{
        "LocalSource" = "$PSScriptRoot/client-customer"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/staging.resortwala.com"
        "Type"        = "React"
    }
    "Admin"    = @{
        "LocalSource" = "$PSScriptRoot/client-admin"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/stagingadmin.resortwala.com"
        "Type"        = "React"
    }
    "API"      = @{
        "LocalSource" = "$PSScriptRoot/api"
        "DistDir"     = "." 
        "RemotePath"  = "$RemoteBasePath/stagingapi.resortwala.com"
        "Type"        = "Laravel"
        "Excludes"    = @(".env", "node_modules", "vendor", ".git", "storage/*.key", "tests") # Vendor excluded (install on server)
    }
    "Vendor"   = @{
        "LocalSource" = "$PSScriptRoot/client-vendor"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/stagingvendor.resortwala.com"
        "Type"        = "React"
    }
}

function Build-ReactApp {
    param ($Name, $Config)
    Write-Host "[$Name] Starting Build..." -ForegroundColor Cyan
    Push-Location $Config.LocalSource
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "[$Name] Installing dependencies..." -ForegroundColor Yellow
            npm install
        }
        # Force a clean build if possible, but standard build is fine
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$Name] Build Successful." -ForegroundColor Green
        }
        else {
            Write-Error "[$Name] Build Failed."
            return $false
        }
    }
    finally {
        Pop-Location
    }
    return $true
}

function Deploy-Component {
    param ($Name, $Config)
    
    $SourcePath = Join-Path $Config.LocalSource $Config.DistDir
    
    Write-Host "[$Name] Initializing Deployment..." -ForegroundColor Cyan
    
    # Create Temp Directory for Staging
    $TempDir = Join-Path $Env:TEMP "ResortWalaDeploy_$Name"
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $TempDir | Out-Null
    
    # 1. Prepare files in Temp
    Write-Host "[$Name] Staging files..." -ForegroundColor Gray
    Copy-Item -Path "$SourcePath/*" -Destination $TempDir -Recurse -Force
    $SourcePath = $TempDir

    # 3. Clean Remote Folder (Linux)
    Write-Host "[$Name] Cleaning Remote Directory..." -ForegroundColor Red
    
    # Ensure remote directory exists
    ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "mkdir -p $($Config.RemotePath)"

    # Clean contents (preserve .env)
    $RemoteCleanCmd = "find $($Config.RemotePath)/ -mindepth 1 ! -name '.env' -delete"
    ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCleanCmd"
    
    # 2. Compress (Tar Gzip for Linux Compatibility)
    $TarFileName = "deploy_package.tar.gz"
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
            ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "chmod -R 755 $($Config.RemotePath)"
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
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
}

# --- DIRECT EXECUTION ---
Write-Host "Starting Direct Deployment for Vendor App..." -ForegroundColor Magenta
if (Build-ReactApp "Vendor" $Paths.Vendor) {
    Deploy-Component "Vendor" $Paths.Vendor
}
