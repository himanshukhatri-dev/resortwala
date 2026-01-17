<#
.SYNOPSIS
    Deployment script for ResortWala Staging (Optimized & Robust).
    
.DESCRIPTION
    Builds and deploys components using Zip Compression + Base64 SSH Commands:
    1. Customer Frontend (React) -> staging.resortwala.com
    2. Admin Frontend (React)    -> stagingadmin.resortwala.com
    3. API Backend (Laravel)     -> stagingapi.resortwala.com

    Prerequisites:
    - Node.js & npm installed
    - SCP installed (OpenSSH Client)
    - Credentials for Server

.NOTES
    Author: Himanshu
    Date: 2025-12-13
#>

param (
    [string]$ServerIP = "77.37.47.243",
    [string]$User = "root",
    [string]$RemoteBasePath = "/var/www/html",
    [switch]$AutoDeployAll = $false,
    [string]$Component = ""
)

# Configuration
$Paths = @{
    "Customer"   = @{
        "LocalSource" = "$PSScriptRoot/client-customer"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/staging.resortwala.com"
        "Type"        = "React"
    }
    "Admin"      = @{
        "LocalSource" = "$PSScriptRoot/client-admin"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/stagingadmin.resortwala.com"
        "Type"        = "React"
    }
    "API"        = @{
        "LocalSource" = "$PSScriptRoot/api"
        "DistDir"     = "." 
        "RemotePath"  = "$RemoteBasePath/stagingapi.resortwala.com"
        "Type"        = "Laravel"
        "Excludes"    = @(".env", "node_modules", "vendor", ".git", "storage/*.key", "tests") # Vendor excluded (install on server)
    }
    "Vendor"     = @{
        "LocalSource" = "$PSScriptRoot/client-vendor"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/stagingvendor.resortwala.com"
        "Type"        = "React"
    }
    "Beta"       = @{
        "LocalSource" = "$PSScriptRoot/client-customer"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/beta.resortwala.com"
        "Type"        = "React"
    }
    "ComingSoon" = @{
        "LocalSource" = "$PSScriptRoot/coming_soon"
        "DistDir"     = "."
        "RemotePath"  = "$RemoteBasePath/resortwala.com"
        "Type"        = "Static"
    }
    "Production" = @{
        "LocalSource" = "$PSScriptRoot/client-customer"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/resortwala.com"
        "Type"        = "React"
    }
    "ProdAPI"    = @{
        "LocalSource" = "$PSScriptRoot/api"
        "DistDir"     = "." 
        "RemotePath"  = "$RemoteBasePath/api.resortwala.com"
        "Type"        = "Laravel"
        "Excludes"    = @(".env", "node_modules", "vendor", ".git", "storage/*.key", "tests")
    }
    "ProdAdmin"  = @{
        "LocalSource" = "$PSScriptRoot/client-admin"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/admin.resortwala.com"
        "Type"        = "React"
    }
    "ProdVendor" = @{
        "LocalSource" = "$PSScriptRoot/client-vendor"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/vendor.resortwala.com"
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

function Build-Laravel {
    param ($Name, $Config)
    Write-Host "[$Name] Installing Dependencies (Production)..." -ForegroundColor Cyan
    Push-Location $Config.LocalSource
    try {
        # Check if composer is installed
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
    
    $SourcePath = Join-Path $Config.LocalSource $Config.DistDir
    
    Write-Host "[$Name] Initializing Deployment..." -ForegroundColor Cyan
    
    # Create Temp Directory for Staging
    # Create Temp Directory for Staging (Unique per run to avoid locks)
    $RandomId = Get-Random
    $TempDir = Join-Path $Env:TEMP "ResortWalaDeploy_${Name}_${RandomId}"
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $TempDir | Out-Null
    
    # 1. Prepare files in Temp
    Write-Host "[$Name] Staging files..." -ForegroundColor Gray
    if ($Config.Type -eq "Laravel") {
        Copy-Item -Path "$($Config.LocalSource)/*" -Destination $TempDir -Recurse -Force
        foreach ($exclude in $Config.Excludes) {
            $Item = Join-Path $TempDir $exclude
            if (Test-Path $Item) { Remove-Item $Item -Recurse -Force }
        }
        $SourcePath = $TempDir
    }
    else {
        # Validates if DistDir is "." to avoid appending /. to the path which can cause copy issues
        if ($Config.DistDir -eq ".") {
            Copy-Item -Path "$($Config.LocalSource)/*" -Destination $TempDir -Recurse -Force
        }
        else {
            Copy-Item -Path "$SourcePath/*" -Destination $TempDir -Recurse -Force
        }
        $SourcePath = $TempDir
    }

    # 3. Clean Remote Folder (Linux)
    Write-Host "[$Name] Cleaning Remote Directory..." -ForegroundColor Red
    
    # Ensure remote directory exists
    ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "mkdir -p $($Config.RemotePath)"

    # Clean contents (preserve .env and ENTIRE storage directory)
    $RemoteCleanCmd = "find $($Config.RemotePath)/ -mindepth 1 ! -name '.env' ! -path '$($Config.RemotePath)/storage' ! -path '$($Config.RemotePath)/storage/*' -delete"
    ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCleanCmd"
    
    # 2. Compress (Tar Gzip for Linux Compatibility)
    # Use localized filename to avoid 'tar' interpreting "C:" as a remote host in MinGW
    $TarFileName = "deploy_package_${Name}_${RandomId}.tar.gz"
    # Create in current directory to ensure relative path usage
    $TarPath = ".\$TarFileName"
    
    if (Test-Path $TarPath) { Remove-Item $TarPath -Force }
    
    Write-Host "[$Name] Compressing (tar.gz)..." -ForegroundColor Yellow
    
    # Use --force-local if supported, or just rely on relative path
    # We use relative path for output: "$TarPath"
    tar -czf "$TarPath" -C "$SourcePath" .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[$Name] Compression Failed. Ensure 'tar' is in your PATH (Windows 10+)."
        return
    }

    # 4. Transfer
    Write-Host "[$Name] Uploading..." -ForegroundColor Cyan
    
    # Use Resolve-Path to get absolute path for SCP to avoid ambiguity
    $AbsTarPath = (Resolve-Path $TarPath).Path
    scp -o StrictHostKeyChecking=no "$AbsTarPath" "${User}@${ServerIP}:$($Config.RemotePath)/$TarFileName"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$Name] Extracting..." -ForegroundColor Green
        
        # 5. Extract Remotely (Linux)
        $RemoteExtractCmd = "tar -xzf $($Config.RemotePath)/$TarFileName -C $($Config.RemotePath) && rm $($Config.RemotePath)/$TarFileName"
        
        ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteExtractCmd"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$Name] SUCCESS." -ForegroundColor Green
            
            # Additional Steps for Laravel
            if ($Config.Type -eq "Laravel") {
                Write-Host "[$Name] Finalizing Laravel Setup on Server..." -ForegroundColor Cyan
                
                # Use a single line with && to ensure steps run sequentially and fail fast
                # We also explicitly set permission 777 on logs to avoid any ambiguity
                $RemoteSetupCmd = "cd $($Config.RemotePath) && " +
                "chown -R www-data:www-data . && " +
                "mkdir -p storage/logs storage/framework/views storage/framework/cache/data storage/framework/sessions bootstrap/cache && " +
                "chown -R www-data:www-data storage bootstrap/cache public && " +
                "chmod -R 775 storage bootstrap/cache && " +
                "chmod -R 755 public && " +
                "chmod -R 777 storage/logs && " +
                "export COMPOSER_ALLOW_SUPERUSER=1 && " +
                "composer install --no-dev --optimize-autoloader --no-interaction && " +
                "chown -R www-data:www-data storage bootstrap/cache vendor public && " +
                "chmod -R 775 storage bootstrap/cache && " +
                "chmod -R 755 public && " +
                "php artisan migrate --force && " +
                "php artisan storage:link && " +
                "php artisan optimize:clear"

                ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteSetupCmd"

            }
            else {
                # Regular permissions for static React apps or HTML pages
                ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "chmod -R 755 $($Config.RemotePath)"
            }
        }
        else {
            Write-Host "[$Name] Extraction Failed (SSH Error)." -ForegroundColor Red
        }
    }
    else {
        Write-Error "[$Name] SCP Upload Failed."
    }
    
    # Cleanup local
    if (Test-Path $TarPath) { Remove-Item $TarPath -Force }
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
}

# Execution Logic
if ($AutoDeployAll) {
    Write-Host "Auto-Deploying ALL components..." -ForegroundColor Magenta
    if (Build-ReactApp "Customer" $Paths.Customer) { Deploy-Component "Customer" $Paths.Customer }
    if (Build-ReactApp "Admin" $Paths.Admin) { Deploy-Component "Admin" $Paths.Admin }
    if (Build-Laravel "API" $Paths.API) { Deploy-Component "API" $Paths.API }
    if (Build-ReactApp "Vendor" $Paths.Vendor) { Deploy-Component "Vendor" $Paths.Vendor }
    exit
}

if ($Component) {
    switch ($Component) {
        "Customer" { if (Build-ReactApp "Customer" $Paths.Customer) { Deploy-Component "Customer" $Paths.Customer } }
        "Admin" { if (Build-ReactApp "Admin" $Paths.Admin) { Deploy-Component "Admin" $Paths.Admin } }
        "API" { if (Build-Laravel "API" $Paths.API) { Deploy-Component "API" $Paths.API } }
        "Vendor" { if (Build-ReactApp "Vendor" $Paths.Vendor) { Deploy-Component "Vendor" $Paths.Vendor } }
        "Beta" { 
            if (Build-ReactApp "Beta" $Paths.Beta) { 
                Deploy-Component "Beta" $Paths.Beta 
                Write-Host "NOTE: Ensure 'beta.resortwala.com' points to $ServerIP" -ForegroundColor Cyan
            } 
        }
        "ComingSoon" { 
            Deploy-Component "ComingSoon" $Paths.ComingSoon 
            Write-Host "NOTE: Ensure 'resortwala.com' points to $ServerIP" -ForegroundColor Cyan
        }
        "Production" { if (Build-ReactApp "Production" $Paths.Production) { Deploy-Component "Production" $Paths.Production } }
        "ProdAPI" { if (Build-Laravel "ProdAPI" $Paths.ProdAPI) { Deploy-Component "ProdAPI" $Paths.ProdAPI } }
        "ProdAdmin" { if (Build-ReactApp "ProdAdmin" $Paths.ProdAdmin) { Deploy-Component "ProdAdmin" $Paths.ProdAdmin } }
        "ProdVendor" { if (Build-ReactApp "ProdVendor" $Paths.ProdVendor) { Deploy-Component "ProdVendor" $Paths.ProdVendor } }
        Default { Write-Error "Invalid Component. Use: Customer, Admin, API, Vendor, Beta, ComingSoon, Production, ProdAPI, ProdAdmin, ProdVendor" }
    }
    exit
}

# Menu
Clear-Host
Write-Host "=========================================="
Write-Host "   ResortWala Deployment Manager (v3 Final)"
Write-Host "=========================================="
Write-Host "1. Deploy Customer App (React)"
Write-Host "2. Deploy Admin App (React)"
Write-Host "3. Deploy API (Laravel)"
Write-Host "4. Deploy Vendor App (React)"
Write-Host "5. Deploy ALL Staging"
Write-Host "6. Deploy Beta (beta.resortwala.com)"
Write-Host "7. Deploy Coming Soon (resortwala.com)"
Write-Host "8. Deploy Customer App to WWW (resortwala.com)"
Write-Host "9. Promote Beta to Live (API + Frontend)"
Write-Host "Q. Quit"
Write-Host "=========================================="

$Selection = Read-Host "Select Option"

switch ($Selection) {
    "1" { 
        if (Build-ReactApp "Customer" $Paths.Customer) { Deploy-Component "Customer" $Paths.Customer }
    }
    "2" { 
        if (Build-ReactApp "Admin" $Paths.Admin) { Deploy-Component "Admin" $Paths.Admin }
    }
    "3" {
        if (Build-Laravel "API" $Paths.API) { Deploy-Component "API" $Paths.API }
    }
    "4" {
        if (Build-ReactApp "Vendor" $Paths.Vendor) { Deploy-Component "Vendor" $Paths.Vendor }
    }
    "5" {
        if (Build-ReactApp "Customer" $Paths.Customer) { Deploy-Component "Customer" $Paths.Customer }
        if (Build-ReactApp "Admin" $Paths.Admin) { Deploy-Component "Admin" $Paths.Admin }
        if (Build-Laravel "API" $Paths.API) { Deploy-Component "API" $Paths.API }
        if (Build-ReactApp "Vendor" $Paths.Vendor) { Deploy-Component "Vendor" $Paths.Vendor }
    }
    "6" {
        if (Build-ReactApp "Beta" $Paths.Beta) { 
            Deploy-Component "Beta" $Paths.Beta 
            Write-Host "NOTE: Ensure 'beta.resortwala.com' points to $ServerIP" -ForegroundColor Cyan
        }
    }
    "7" {
        Deploy-Component "ComingSoon" $Paths.ComingSoon
        Write-Host "NOTE: Ensure 'resortwala.com' points to $ServerIP" -ForegroundColor Cyan
    }
    "8" {
        if (Build-ReactApp "Production" $Paths.Production) { 
            Deploy-Component "Production" $Paths.Production 
            Write-Host "NOTE: Customer App is now LIVE on www.resortwala.com" -ForegroundColor Cyan
        }
    }
    "9" {
        Write-Host "⚠️ PROMOTING BETA TO LIVE (PRODUCTION) ⚠️" -ForegroundColor Yellow
        if (Build-ReactApp "Production" $Paths.Production) { 
            Deploy-Component "Production" $Paths.Production 
        }
        if (Build-Laravel "ProdAPI" $Paths.ProdAPI) { 
            Deploy-Component "ProdAPI" $Paths.ProdAPI 
        }
        if (Build-ReactApp "ProdAdmin" $Paths.ProdAdmin) { 
            Deploy-Component "ProdAdmin" $Paths.ProdAdmin 
        }
        if (Build-ReactApp "ProdVendor" $Paths.ProdVendor) { 
            Deploy-Component "ProdVendor" $Paths.ProdVendor 
        }
        Write-Host "✅ LIVE DEPLOYMENT COMPLETE (Customer + API + Admin + Vendor)" -ForegroundColor Green
    }
    "Q" { exit }
    Default { Write-Host "Invalid Selection" -ForegroundColor Red }
}
