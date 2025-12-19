param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root"
)

# 1. Define Nginx Config Content
$NginxConfig = @"
server {
    listen 80 default_server;
    server_name _;
    
    # Root (Customer App)
    root /var/www/html/staging.resortwala.com;
    index index.html;

    location / {
        try_files `$uri `$uri/ /index.html;
    }

    # Vendor App
    location /vendor {
        alias /var/www/html/stagingvendor.resortwala.com;
        try_files `$uri `$uri/ /vendor/index.html;
    }

    # Admin App
    location /admin {
        alias /var/www/html/stagingadmin.resortwala.com;
        try_files `$uri `$uri/ /admin/index.html;
    }

    # API Proxy
    location /api {
        alias /var/www/html/stagingapi.resortwala.com/public;
        try_files `$uri `$uri/ @laravel;
    }

    location @laravel {
        rewrite /api/(.*)$ /api/`$1 break;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/html/stagingapi.resortwala.com/public/index.php;
    }

    # Static Assets Caching (Optional but good)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires max;
        log_not_found off;
    }
}
"@

# Save Nginx Config Locally
$NginxConfig | Out-File -FilePath "nginx_default.conf" -Encoding ASCII

Write-Host "=== 1. Building Applications with New Base Paths ===" -ForegroundColor Cyan

# Helper to build
function Build-App {
    param($Path, $Name)
    Write-Host "Building $Name..."
    Push-Location $Path
    cmd /c "npm run build"
    if ($LASTEXITCODE -ne 0) { Write-Error "$Name Build Failed"; exit 1 }
    Pop-Location
}

# Build All
Build-App "client-customer" "Customer App"
Build-App "client-vendor" "Vendor App"
Build-App "client-admin" "Admin App"

Write-Host "=== 2. Uploading Nginx Config & Apps ===" -ForegroundColor Cyan

# Create Tarball of builds to upload efficiently
$TarFile = "deploy_bundle.tar.gz"
if (Test-Path $TarFile) { Remove-Item $TarFile }

# Create a temporary folder to stage headers
$StageDir = "temp_stage"
if (Test-Path $StageDir) { Remove-Item $StageDir -Recurse }
New-Item -ItemType Directory -Path $StageDir | Out-Null

# Copy dist folders
Copy-Item -Path "client-customer/dist" -Destination "$StageDir/customer" -Recurse
Copy-Item -Path "client-vendor/dist" -Destination "$StageDir/vendor" -Recurse
Copy-Item -Path "client-admin/dist" -Destination "$StageDir/admin" -Recurse

# Compress
tar -czf $TarFile -C $StageDir .

# Upload Content
scp -o StrictHostKeyChecking=no $TarFile "${User}@${ServerIP}:/tmp/$TarFile"
scp -o StrictHostKeyChecking=no "nginx_default.conf" "${User}@${ServerIP}:/tmp/nginx_default.conf"

Write-Host "=== 3. Applying Changes on Server ===" -ForegroundColor Cyan

$RemoteScript = @"
# 1. Clean and Deploy Frontends
rm -rf /var/www/html/staging.resortwala.com/*
rm -rf /var/www/html/stagingvendor.resortwala.com/*
rm -rf /var/www/html/stagingadmin.resortwala.com/*

mkdir -p /var/www/html/staging.resortwala.com
mkdir -p /var/www/html/stagingvendor.resortwala.com
mkdir -p /var/www/html/stagingadmin.resortwala.com

tar -xzf /tmp/$TarFile -C /tmp
cp -r /tmp/customer/* /var/www/html/staging.resortwala.com/
cp -r /tmp/vendor/* /var/www/html/stagingvendor.resortwala.com/
cp -r /tmp/admin/* /var/www/html/stagingadmin.resortwala.com/

# 2. Fix Permissions
chown -R www-data:www-data /var/www/html

# 3. Apply Nginx Config
# Detect PHP Version for FPM to be safe
PHP_VER=\`ls /var/run/php/php*-fpm.sock | grep -oP 'php\d\.\d' | head -1\`
echo "Detected PHP Socket Version: \$PHP_VER"

# Update config with detected PHP version
sed -i "s/php8.2/\$PHP_VER/g" /tmp/nginx_default.conf

# Determine Target Content (Prefer 'resortwala' if exists, else 'default')
TARGET_CONF="/etc/nginx/sites-available/resortwala"
if [ ! -f "$TARGET_CONF" ]; then
    TARGET_CONF="/etc/nginx/sites-available/default"
fi

echo "Overwriting Nginx Config at: \$TARGET_CONF"
mv /tmp/nginx_default.conf \$TARGET_CONF

# Ensure Symlink Exists
LINK_NAME=\$(basename \$TARGET_CONF)
if [ ! -e "/etc/nginx/sites-enabled/\$LINK_NAME" ]; then
    ln -s \$TARGET_CONF /etc/nginx/sites-enabled/\$LINK_NAME
fi

nginx -t

if [ \$? -eq 0 ]; then
    systemctl restart nginx
    echo "Nginx Restarted Successfully."
else
    echo "Nginx Config Test Failed! Rolling back..."
    # You might want a backup here in a real prod scenario
fi

# Cleanup
rm -rf /tmp/customer /tmp/vendor /tmp/admin /tmp/$TarFile
"@

# Normalize line endings for Linux
$RemoteScript = $RemoteScript -replace "`r`n", "`n"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteScript"

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Customer: http://${ServerIP}/"
Write-Host "Vendor:   http://${ServerIP}/vendor/"
Write-Host "Admin:    http://${ServerIP}/admin/"
Write-Host "API:      http://${ServerIP}/api/ping"
