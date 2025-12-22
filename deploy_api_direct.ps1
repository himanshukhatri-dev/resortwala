<#
.SYNOPSIS
    Direct Deployment script for API (Generated Patch).
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root",
    [string]$RemoteBasePath = "/var/www/html"
)

# Configuration
$Config = @{
    "LocalSource" = "$PSScriptRoot/api"
    "DistDir"     = "." 
    "RemotePath"  = "$RemoteBasePath/stagingapi.resortwala.com"
    "Type"        = "Laravel"
    "Excludes"    = @(".env", "node_modules", "vendor", ".git", "storage/*.key", "tests")
}
$Name = "API"

function Build-Laravel {
    param ($Name, $Config)
    Write-Host "[$Name] Installing Dependencies (Production)..." -ForegroundColor Cyan
    Push-Location $Config.LocalSource
    try {
        if (Get-Command "composer" -ErrorAction SilentlyContinue) {
            composer install --optimize-autoloader --no-dev
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[$Name] Composer Install Successful." -ForegroundColor Green
            }
            else {
                Write-Error "[$Name] Composer Install Failed."
                return $false
            }
        }
        else {
            Write-Warning "Composer not found. Skipping dependency installation."
        }
    }
    finally {
        Pop-Location
    }
    return $true
}

function Deploy-Component {
    param ($Name, $Config)
    
    # Laravel uses temp dir logic similar to original script
    $TempDir = Join-Path $Env:TEMP "ResortWalaDeploy_$Name"
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $TempDir | Out-Null
    
    Write-Host "[$Name] Staging files..." -ForegroundColor Gray
    Copy-Item -Path "$($Config.LocalSource)/*" -Destination $TempDir -Recurse -Force
    foreach ($exclude in $Config.Excludes) {
        $Item = Join-Path $TempDir $exclude
        if (Test-Path $Item) { Remove-Item $Item -Recurse -Force }
    }
    $SourcePath = $TempDir

    Write-Host "[$Name] Cleaning Remote Directory..." -ForegroundColor Red
    ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "mkdir -p $($Config.RemotePath)"
    # Clean but keep .env and storage
    $RemoteCleanCmd = "find $($Config.RemotePath)/ -maxdepth 1 -mindepth 1 ! -name '.env' ! -name 'storage' -exec rm -rf {} \;"
    ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCleanCmd"
    
    $TarFileName = "deploy_package.tar.gz"
    $TarPath = ".\$TarFileName"
    if (Test-Path $TarPath) { Remove-Item $TarPath -Force }
    
    Write-Host "[$Name] Compressing..." -ForegroundColor Yellow
    tar -czf "$TarPath" -C "$SourcePath" .
    
    Write-Host "[$Name] Uploading..." -ForegroundColor Cyan
    $AbsTarPath = (Resolve-Path $TarPath).Path
    scp -o StrictHostKeyChecking=no "$AbsTarPath" "${User}@${ServerIP}:$($Config.RemotePath)/$TarFileName"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$Name] Extracting and Finalizing..." -ForegroundColor Green
        
        $RemoteSetupCmd = "cd $($Config.RemotePath) && " +
        "tar -xzf $TarFileName && rm $TarFileName && " +
        "chown -R www-data:www-data . && " +
        "mkdir -p storage/logs storage/framework/views storage/framework/cache/data storage/framework/sessions bootstrap/cache && " +
        "chown -R www-data:www-data storage bootstrap/cache && " +
        "chmod -R 775 storage bootstrap/cache && " +
        "chmod -R 777 storage/logs && " +
        "export COMPOSER_ALLOW_SUPERUSER=1 && " +
        "composer install --no-dev --optimize-autoloader --no-interaction && " +
        "chown -R www-data:www-data storage bootstrap/cache vendor && " +
        "chmod -R 775 storage bootstrap/cache && " +
        "php artisan migrate --force"

        ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteSetupCmd"
        Write-Host "[$Name] SUCCESS." -ForegroundColor Green
    }
    
    if (Test-Path $TarPath) { Remove-Item $TarPath -Force }
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
}

# --- EXECUTE ---
Write-Host "Starting Direct Deployment for API..." -ForegroundColor Magenta
if (Build-Laravel "API" $Config) {
    Deploy-Component "API" $Config
}
