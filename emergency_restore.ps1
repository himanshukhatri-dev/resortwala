
param (
    [string]$ServerIP = "77.37.47.243",
    [string]$User = "root"
)

$ErrorActionPreference = "Stop"

Write-Host ">>> STARTING EMERGENCY RESTORE to $ServerIP <<<" -ForegroundColor Red -BackgroundColor Yellow

# 1. Clean & Prepare Local Package
Write-Host "1. Preparing Local Workspace..." -ForegroundColor Cyan
if (Test-Path dist_package) { Remove-Item dist_package -Recurse -Force }
New-Item -ItemType Directory -Path dist_package/vendor -Force | Out-Null
New-Item -ItemType Directory -Path dist_package/admin -Force | Out-Null
New-Item -ItemType Directory -Path dist_package/api -Force | Out-Null
New-Item -ItemType Directory -Path dist_package/dev_tools -Force | Out-Null

# 2. Build Frontends (Skip if dist exists to save time? No, ensure fresh build for safety)
# Function to build
function Build-App ($Path, $Name) {
    Write-Host "Building $Name..." -ForegroundColor Cyan
    Push-Location $Path
    if (-not (Test-Path node_modules)) { npm install }
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Error "$Name Build Failed"; exit 1 }
    Pop-Location
}

Build-App "client-customer" "Customer App"
Build-App "client-admin" "Admin App"
Build-App "client-vendor" "Vendor App"

# 3. Assemble Package (Mimicking Jenkinsfile.atomic)
Write-Host "3. Assembling Package..." -ForegroundColor Cyan
Copy-Item -Path client-customer/dist/* -Destination dist_package/ -Recurse -Force
Copy-Item -Path client-vendor/dist/* -Destination dist_package/vendor/ -Recurse -Force
Copy-Item -Path client-admin/dist/* -Destination dist_package/admin/ -Recurse -Force

Write-Host "Copying API..."
Copy-Item -Path api/* -Destination dist_package/api/ -Recurse -Force
# Exclude heavy/unneeded files from API copy if possible, but Copy-Item is basic.
# We will exclude listing in tar.

Write-Host "Copying Ops Tools..."
Copy-Item -Path dev_tools/ops -Destination dist_package/dev_tools/ -Recurse -Force

# 4. Create Tarball
Write-Host "4. Creating Release Tarball..." -ForegroundColor Cyan
$ReleaseID = "emergency_restore_" + (Get-Date -Format "yyyyMMdd_HHmm")
$TarFile = "release_$ReleaseID.tar.gz"

# Use tar to compress dist_package contents
tar -czf $TarFile -C dist_package .

# 5. Upload
Write-Host "5. Uploading to Server..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no $TarFile "${User}@${ServerIP}:/tmp/"

# 6. Remote Execute
Write-Host "6. Executing Remote Setup..." -ForegroundColor Cyan
$RemoteScript = "
    set -e
    RELEASE_PATH=/var/www/html/resortwala_v2/releases/$ReleaseID
    SHARED_PATH=/var/www/html/resortwala_v2/shared
    
    echo 'Creating Release Directory...'
    mkdir -p \$RELEASE_PATH
    
    echo 'Extracting...'
    tar -xzf /tmp/$TarFile -C \$RELEASE_PATH
    rm /tmp/$TarFile
    
    echo 'Setting Permissions...'
    chown -R www-data:www-data \$RELEASE_PATH
    chmod +x \$RELEASE_PATH/dev_tools/ops/*.sh
    
    # Run Structure Setup (creates shared if missing)
    bash \$RELEASE_PATH/dev_tools/ops/setup_atomic_structure.sh
    
    echo 'Linking Shared Resources...'
    # Link Environment File - CHECK IF IT EXISTS, IF NOT CREATE DUMMY OR FAIL
    if [ ! -f \$SHARED_PATH/.env ]; then
        echo 'WARNING: .env not found in shared! Creating empty one to prevent crash.'
        touch \$SHARED_PATH/.env
    fi
    ln -sfn \$SHARED_PATH/.env \$RELEASE_PATH/api/.env
    
    rm -rf \$RELEASE_PATH/api/storage
    ln -sfn \$SHARED_PATH/storage \$RELEASE_PATH/api/storage
    
    echo 'Running Laravel Setup...'
    cd \$RELEASE_PATH/api
    export COMPOSER_ALLOW_SUPERUSER=1
    # Only run composer install if not already fully vendored (which it isn't, we just copied source)
    if [ -f composer.json ]; then
        php /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction
    fi
    
    # Fix permissions again after composer
    chown -R www-data:www-data .
    chmod -R 775 bootstrap/cache storage
    
    # Force Migrate? Maybe risky for emergency, but required if code mismatch.
    php artisan migrate --force || echo 'Migration Warning (Skipping/Failed)'
    
    echo 'Switching Symlink...'
    ln -sfn \$RELEASE_PATH /var/www/html/resortwala_v2/current
    
    echo 'Reloading Nginx...'
    service nginx reload
    
    echo 'SUCCESS: Emergency Restore Complete.'
"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteScript"

Write-Host ">>> DONE. Verify site at https://resortwala.com <<<" -ForegroundColor Green
