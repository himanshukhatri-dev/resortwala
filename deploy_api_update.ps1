param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root"
)

Write-Host "=== Deploying API Updates Only ===" -ForegroundColor Cyan

# 1. Compress API
$TarFile = "api_update.tar.gz"
if (Test-Path $TarFile) { Remove-Item $TarFile -Force }

# Exclude vendor/node_modules
tar -czf $TarFile -C api --exclude="vendor" --exclude="node_modules" --exclude=".env" .

# 2. Upload
Write-Host "Uploading..."
scp -o StrictHostKeyChecking=no $TarFile "${User}@${ServerIP}:/tmp/$TarFile"

# 3. Extract and Seed
Write-Host "Updating Server..."
$RemoteScript = @"
cd /var/www/html/stagingapi.resortwala.com
# Backup .env
cp .env /tmp/env.bak

# Extract
tar -xzf /tmp/$TarFile

# Restore .env (just in case, though tar exclude should handle it)
# cp /tmp/env.bak .env

# Fix Permissions for new files
chown -R www-data:www-data .
chmod -R 775 storage bootstrap/cache

# Refresh Autoloader & Install New Dependencies
echo "Updating Dependencies..."
export COMPOSER_ALLOW_SUPERUSER=1
# Run update to fix lock file mismatch
composer update --no-dev --optimize-autoloader

# Generate Key & Cache (If needed)
php artisan key:generate --force
php artisan config:cache

# Run Migrations
echo "Running Migrations..."
php artisan migrate --force

# Run Seeder
echo "Running Seeders..."
php artisan db:seed --force

echo "Cleanup..."
rm /tmp/$TarFile
echo "SUCCESS."
"@

# Normalize Line Endings
$RemoteScript = $RemoteScript -replace "`r`n", "`n"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteScript"
