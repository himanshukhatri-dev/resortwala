<#
.SYNOPSIS
    Direct Deployment script for Admin App (Generated Patch).
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root",
    [string]$RemoteBasePath = "/var/www/html"
)

# Configuration
$Paths = @{
    "Admin" = @{
        "LocalSource" = "$PSScriptRoot/client-admin"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/stagingadmin.resortwala.com"
        "Type"        = "React"
    }
    "API"   = @{
        "LocalSource" = "$PSScriptRoot/api"
        "DistDir"     = "." 
        "RemotePath"  = "$RemoteBasePath/stagingapi.resortwala.com"
        "Type"        = "Laravel"
        "Excludes"    = @(".env", "node_modules", "vendor", ".git", "storage/*.key", "tests")
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
    
    if ($Config.Type -eq "Laravel") {
        # Copy everything except excludes
        Copy-Item -Path "$SourcePath/*" -Destination $TempDir -Recurse -Force
        
        # Remove Excludes
        if ($Config.Excludes) {
            foreach ($exclude in $Config.Excludes) {
                # Simple wildcard removal logic for temp dir
                $RemovePath = Join-Path $TempDir $exclude
                if (Test-Path $RemovePath) { Remove-Item $RemovePath -Recurse -Force -ErrorAction SilentlyContinue }
            }
        }
    }
    else {
        # React: Just copy dist contents
        Copy-Item -Path "$SourcePath/*" -Destination $TempDir -Recurse -Force
    }

    $SourcePath = $TempDir

    # 3. Clean Remote Folder (Linux)
    Write-Host "[$Name] Cleaning Remote Directory..." -ForegroundColor Red
    
    # Ensure remote directory exists
    ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "mkdir -p $($Config.RemotePath)"

    # Clean contents (preserve .env and storage/app directory with uploaded media)
    $RemoteCleanCmd = "find $($Config.RemotePath)/ -mindepth 1 ! -name '.env' ! -path '$($Config.RemotePath)/storage/app' ! -path '$($Config.RemotePath)/storage/app/*' -delete"
    ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCleanCmd"
    
    # 2. Compress (Tar Gzip for Linux Compatibility)
    $TarFileName = "deploy_package_admin.tar.gz"
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
            
            # Fix permissions for Laravel API deployments
            if ($Config.Type -eq "Laravel") {
                Write-Host "[$Name] Setting permissions..." -ForegroundColor Yellow
                ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "chown -R www-data:www-data $($Config.RemotePath)/storage $($Config.RemotePath)/public && chmod -R 775 $($Config.RemotePath)/storage && chmod -R 755 $($Config.RemotePath)/public && chmod -R 755 $($Config.RemotePath)"
                Write-Host "[$Name] Permissions fixed." -ForegroundColor Green
            }
            else {
                ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "chmod -R 755 $($Config.RemotePath)"
            }
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
Write-Host "Starting Direct Deployment for Admin & API..." -ForegroundColor Magenta

# 1. Deploy API (No build needed for Laravel, just rsync/scp)
Deploy-Component "API" $Paths.API

# 2. Deploy Admin App
if (Build-ReactApp "Admin" $Paths.Admin) {
    Deploy-Component "Admin" $Paths.Admin
}
