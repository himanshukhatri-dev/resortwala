param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root",
    [string]$ApiDomain = "http://stagingapi.resortwala.com"
)

# --- Configuration ---
Write-Host "=== ResortWala Fresh Deployment ===" -ForegroundColor Cyan
Write-Host "Target Server: $ServerIP" -ForegroundColor Gray
Write-Host "API Domain: $ApiDomain" -ForegroundColor Gray
Write-Host ""

$DbName = Read-Host "Enter Database Name (e.g. resortwala_staging)"
$DbUser = Read-Host "Enter Database Username"
$DbPass = Read-Host "Enter Database Password" -AsSecureString
# Convert SecureString to PlainText for script injection
$DbPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPass))

# Function to Build React Apps
function Build-Client {
    param($Name, $Path, $ApiUrl)
    Write-Host "`n[$Name] Building..." -ForegroundColor Yellow
    Push-Location $Path
    
    # Install if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "  -> Installing dependencies..."
        npm install --silent
    }
    
    # Build with Environment Variable
    $Env:VITE_API_BASE_URL = $ApiUrl
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$Name] Build Success." -ForegroundColor Green
    }
    else {
        Write-Error "[$Name] Build Failed."
        exit 1
    }
    Pop-Location
}

# --- Step 1: Build Frontends ---
Build-Client "Customer" "client-customer" $ApiDomain
Build-Client "Vendor" "client-vendor" $ApiDomain
Build-Client "Admin" "client-admin" $ApiDomain

# --- Step 2: Archive ---
Write-Host "`n[Deploy] Creating Archive..." -ForegroundColor Cyan
$TempDir = "deploy_temp"
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

# Stage Files
Write-Host "  -> Staging Customer..."
New-Item -ItemType Directory -Force -Path "$TempDir/customer" | Out-Null
Copy-Item "client-customer/dist/*" "$TempDir/customer" -Recurse

Write-Host "  -> Staging Vendor..."
New-Item -ItemType Directory -Force -Path "$TempDir/vendor" | Out-Null
Copy-Item "client-vendor/dist/*" "$TempDir/vendor" -Recurse

Write-Host "  -> Staging Admin..."
New-Item -ItemType Directory -Force -Path "$TempDir/admin" | Out-Null
Copy-Item "client-admin/dist/*" "$TempDir/admin" -Recurse

Write-Host "  -> Staging API..."
New-Item -ItemType Directory -Force -Path "$TempDir/api" | Out-Null
Copy-Item "api/*" "$TempDir/api" -Recurse
# Remove clutter
Remove-Item "$TempDir/api/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$TempDir/api/vendor" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$TempDir/api/.env" -Force -ErrorAction SilentlyContinue

# Compress (Using tar for Linux compatibility)
Write-Host "  -> Compressing..."
$TarFile = "fresh_deploy.tar.gz"
if (Test-Path $TarFile) { Remove-Item $TarFile -Force }
tar -czf $TarFile -C $TempDir .
Remove-Item $TempDir -Recurse -Force

# --- Step 3: Upload ---
Write-Host "`n[Deploy] Uploading to Server..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no $TarFile "${User}@${ServerIP}:/tmp/$TarFile"

# --- Step 4: Remote Provisioning ---
Write-Host "`n[Deploy] Configuring Server..." -ForegroundColor Cyan

# We use a Here-String for the remote script.
# PowerShell variables will be expanded before sending.
$RemoteScript = @"
set -e # Exit on error

echo "  -> Setting up directories..."
ROOT="/var/www/html"
mkdir -p `$ROOT/staging.resortwala.com
mkdir -p `$ROOT/stagingvendor.resortwala.com
mkdir -p `$ROOT/stagingadmin.resortwala.com
mkdir -p `$ROOT/stagingapi.resortwala.com

echo "  -> Extracting files..."
cd /tmp
tar -xzf $TarFile
# Sync files (using rsync or cp)
cp -rT customer/ `$ROOT/staging.resortwala.com/
cp -rT vendor/ `$ROOT/stagingvendor.resortwala.com/
cp -rT admin/ `$ROOT/stagingadmin.resortwala.com/
cp -rT api/ `$ROOT/stagingapi.resortwala.com/

echo "  -> Configuring API..."
cd `$ROOT/stagingapi.resortwala.com

# Create .env from example if not exists, then overwrite values
cp .env.example .env

# Magic SED commands to update .env
# Using | as delimiter to avoid issues with / in paths or passwords
sed -i 's|DB_CONNECTION=sqlite|DB_CONNECTION=mysql|g' .env
sed -i 's|# DB_HOST=127.0.0.1|DB_HOST=127.0.0.1|g' .env
sed -i 's|# DB_PORT=3306|DB_PORT=3306|g' .env
sed -i 's|# DB_DATABASE=laravel|DB_DATABASE=$DbName|g' .env
sed -i 's|# DB_USERNAME=root|DB_USERNAME=$DbUser|g' .env
sed -i 's|# DB_PASSWORD=|DB_PASSWORD=$DbPassPlain|g' .env
sed -i 's|APP_URL=http://localhost|APP_URL=$ApiDomain|g' .env
sed -i 's|APP_DEBUG=true|APP_DEBUG=false|g' .env

echo "  -> Setting up Database Structure..."
# Automate DB Creation (Requires root MySQL access without password or config)
# Try to create DB and User if they don't exist
mysql -u root -e "CREATE DATABASE IF NOT EXISTS $DbName;"
mysql -u root -e "CREATE USER IF NOT EXISTS '$DbUser'@'localhost' IDENTIFIED BY '$DbPassPlain';"
mysql -u root -e "GRANT ALL PRIVILEGES ON $DbName.* TO '$DbUser'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

echo "  -> Installing Backend Dependencies..."
export COMPOSER_ALLOW_SUPERUSER=1
composer install --no-dev --optimize-autoloader --quiet

echo "  -> Setting up Database..."
php artisan key:generate
php artisan config:cache
php artisan migrate --force
php artisan db:seed --class=Database\\\\Seeders\\\\BookingSeeder --force
php artisan storage:link

# --- Nginx Configuration ---
echo "  -> Configuring Nginx..."
cat > /etc/nginx/sites-available/resortwala <<'EOF'
# 1. Customer App
server {
    listen 80;
    server_name staging.resortwala.com;
    root /var/www/html/staging.resortwala.com;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 2. Vendor App
server {
    listen 80;
    server_name stagingvendor.resortwala.com;
    root /var/www/html/stagingvendor.resortwala.com;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 3. Admin App
server {
    listen 80;
    server_name stagingadmin.resortwala.com;
    root /var/www/html/stagingadmin.resortwala.com;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 4. API (Laravel)
server {
    listen 80;
    server_name stagingapi.resortwala.com;
    root /var/www/html/stagingapi.resortwala.com/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }
}
EOF

# Link and Reload
ln -sf /etc/nginx/sites-available/resortwala /etc/nginx/sites-enabled/resortwala
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "  -> Fixing Permissions..."
# Fix ownership for ALL directories (Customer, Vendor, Admin, API)
chown -R www-data:www-data `$ROOT
# Ensure directories are executable and files are readable
find `$ROOT -type d -exec chmod 755 {} \;
find `$ROOT -type f -exec chmod 644 {} \;
# Special permissions for Laravel storage
chmod -R 775 `$ROOT/stagingapi.resortwala.com/storage `$ROOT/stagingapi.resortwala.com/bootstrap/cache

echo "  -> cleanup..."
rm /tmp/$TarFile
rm -rf /tmp/customer /tmp/vendor /tmp/admin /tmp/api

echo "SUCCESS! Deployment Finished."
"@

# Normalize to LF line endings for Linux bash execution
$RemoteScript = $RemoteScript -replace "`r`n", "`n"

# Execute Remote Script
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteScript"

Write-Host "`nDeployment Completed Successfully!" -ForegroundColor Green
