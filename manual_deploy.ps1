
param (
    [string]$ServerIP = "77.37.47.243",
    [string]$User = "root",
    [string]$PrivateKeyPath = "$HOME\.ssh\id_rsa" # Adjust if needed or rely on agent
)

$ErrorActionPreference = "Stop"
$ScriptRoot = $PSScriptRoot
$DistPackage = Join-Path $ScriptRoot "dist_package"
$ReleaseID = "manual_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$TarFile = "release_$ReleaseID.tar.gz"
$RemoteBase = "/var/www/html/resortwala_v2"
$ReleasesDir = "$RemoteBase/releases"
$ReleasePath = "$ReleasesDir/$ReleaseID"

Write-Host "Starting Manual Deployment ($ReleaseID)..." -ForegroundColor Cyan

# -------------------------------------------------------------------------
# 1. CLEANUP & PREPARE
# -------------------------------------------------------------------------
Write-Host "Cleaning up previous builds..." -ForegroundColor Gray
if (Test-Path $DistPackage) { Remove-Item $DistPackage -Recurse -Force }
New-Item -ItemType Directory -Path $DistPackage | Out-Null
New-Item -ItemType Directory -Path "$DistPackage\vendor" | Out-Null
New-Item -ItemType Directory -Path "$DistPackage\admin" | Out-Null
New-Item -ItemType Directory -Path "$DistPackage\api" | Out-Null
New-Item -ItemType Directory -Path "$DistPackage\dev_tools" | Out-Null

# -------------------------------------------------------------------------
# 2. BUILD FRONTENDS
# -------------------------------------------------------------------------
Function Build-Frontend ($Path, $Name) {
    Write-Host "Building $Name..." -ForegroundColor Yellow
    Push-Location $Path
    try {
        cmd /c "npm install"
        cmd /c "npm run build"
    }
    finally {
        Pop-Location
    }
}

Build-Frontend (Join-Path $ScriptRoot "client-customer") "Customer App"
Build-Frontend (Join-Path $ScriptRoot "client-vendor") "Vendor App"
Build-Frontend (Join-Path $ScriptRoot "client-admin") "Admin App"

# -------------------------------------------------------------------------
# 3. BUILD API
# -------------------------------------------------------------------------
Write-Host "Building API..." -ForegroundColor Yellow
Push-Location (Join-Path $ScriptRoot "api")
try {
    cmd /c "composer install --no-dev --optimize-autoloader --ignore-platform-reqs"
}
finally {
    Pop-Location
}

# -------------------------------------------------------------------------
# 4. ASSEMBLE ARTIFACTS
# -------------------------------------------------------------------------
Write-Host "Assembling Artifacts..." -ForegroundColor Cyan

# Copy Built Frontends
Copy-Item (Join-Path $ScriptRoot "client-customer\dist\*") "$DistPackage\" -Recurse -Force
Copy-Item (Join-Path $ScriptRoot "client-vendor\dist\*") "$DistPackage\vendor\" -Recurse -Force
Copy-Item (Join-Path $ScriptRoot "client-admin\dist\*") "$DistPackage\admin\" -Recurse -Force

# Copy API (Excluding typical garbage)
Write-Host "Copying API files..." -ForegroundColor Gray
# Using Robocopy for better exclusion handling
$ApiSource = Join-Path $ScriptRoot "api"
$ApiDest = Join-Path $DistPackage "api"
robocopy $ApiSource $ApiDest /E /XD ".git" "storage" "node_modules" "tests" /XF ".env" ".gitignore" ".gitattributes" | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Robocopy failed with exit code $LASTEXITCODE" }

# Copy Ops Tools
Copy-Item (Join-Path $ScriptRoot "dev_tools\ops") "$DistPackage\dev_tools\" -Recurse -Force

# -------------------------------------------------------------------------
# 5. TARBALL
# -------------------------------------------------------------------------
Write-Host "Compressing Release..." -ForegroundColor Yellow
# Assuming 'tar' exists on Windows (it does on Win 10/11)
$TarPath = Join-Path $ScriptRoot $TarFile
tar -czf $TarPath -C $DistPackage .

# -------------------------------------------------------------------------
# 6. UPLOAD
# -------------------------------------------------------------------------
Write-Host "Uploading Payload..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no $TarPath "${User}@${ServerIP}:/tmp/"

# -------------------------------------------------------------------------
# 7. REMOTE DEPLOYMENT
# -------------------------------------------------------------------------
Write-Host "Executing Remote Deployment..." -ForegroundColor Cyan
$RemoteScript = @"
set -e

# A. Create Release Dir
echo 'Creating release directory...'
mkdir -p $ReleasePath

# B. Extract
echo 'Extracting...'
tar -xzf /tmp/$TarFile -C $ReleasePath
rm /tmp/$TarFile

# C. Setup Permissions
echo 'Setting permissions...'
chmod +x $ReleasePath/dev_tools/ops/*.sh

# D. Run Atomic Setup (Ensures shared hierarchy exists)
echo 'Ensuring atomic structure...'
bash $ReleasePath/dev_tools/ops/setup_atomic_structure.sh

# E. Link Shared Resources
echo 'Linking shared resources...'
# .env
if [ -f $RemoteBase/shared/.env ]; then
    ln -sfn $RemoteBase/shared/.env $ReleasePath/api/.env
else
    echo 'WARNING: Shared .env not found!'
fi

# storage
rm -rf $ReleasePath/api/storage
ln -sfn $RemoteBase/shared/storage $ReleasePath/api/storage

# public/uploads (ensure shared/media structure exists via setup script or manually)
# We assume 'setup_atomic_structure.sh' handles mkdir shared/media
mkdir -p $ReleasePath/api/public
rm -rf $ReleasePath/api/public/uploads
ln -sfn $RemoteBase/shared/media/uploads $ReleasePath/api/public/uploads

# F. Fix Ownership
chown -R www-data:www-data $ReleasePath
chmod -R 775 $ReleasePath/api/bootstrap/cache

# G. Database Migration
echo 'Running migrations...'
cd $ReleasePath/api
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:clear

# H. Switch Symlink
echo 'Switching Current...'
ln -sfn $ReleasePath $RemoteBase/current

# I. Reload Services
echo 'Reloading Services...'
service nginx reload
if systemctl is-active --quiet php8.2-fpm; then systemctl reload php8.2-fpm; fi

echo 'Deployment Successful!'
"@

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" $RemoteScript

# -------------------------------------------------------------------------
# 8. CLEANUP LOCAL
# -------------------------------------------------------------------------
Write-Host "Cleaning up local build artifacts..." -ForegroundColor Gray
Remove-Item $DistPackage -Recurse -Force
Remove-Item $TarPath -Force

Write-Host "Deployment Complete! Check https://resortwala.com" -ForegroundColor Green
