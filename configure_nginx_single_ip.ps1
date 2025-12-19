param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root"
)

Write-Host "=== Automating Single IP Deployment (Final - Fixed) ===" -ForegroundColor Cyan

# 1. Define Nginx Config Content
$NginxConfig = @"
server {
    listen 80 default_server;
    server_name _;
    
    # 1. Customer App (Root)
    root /var/www/html/staging.resortwala.com;
    index index.html;

    location / {
        try_files `$uri `$uri/ /index.html;
    }

    # 2. Vendor App
    location /vendor {
        alias /var/www/html/stagingvendor.resortwala.com;
        try_files `$uri `$uri/ /vendor/index.html;
    }

    # 3. Admin App
    location /admin {
        alias /var/www/html/stagingadmin.resortwala.com;
        try_files `$uri `$uri/ /admin/index.html;
    }

    # 4. API Proxy (High Priority)
    location ^~ /api {
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
}
"@

$NginxConfig | Out-File -FilePath "nginx_final.conf" -Encoding ASCII

Write-Host "=== 1. Building Applications ===" -ForegroundColor Cyan

function Build-App {
    param($Path, $Name)
    Write-Host "Building $Name..."
    Push-Location $Path
    cmd /c "npm run build"
    if ($LASTEXITCODE -ne 0) { Write-Error "$Name Build Failed"; exit 1 }
    Pop-Location
}

Build-App "client-customer" "Customer App"
Build-App "client-vendor" "Vendor App"
Build-App "client-admin" "Admin App"

Write-Host "=== 2. Uploading Bundle ===" -ForegroundColor Cyan

$TarFile = "deploy_bundle.tar.gz"
if (Test-Path $TarFile) { Remove-Item $TarFile }

$StageDir = "temp_stage"
if (Test-Path $StageDir) { Remove-Item $StageDir -Recurse }
New-Item -ItemType Directory -Path $StageDir | Out-Null

Copy-Item -Path "client-customer/dist" -Destination "$StageDir/customer" -Recurse
Copy-Item -Path "client-vendor/dist" -Destination "$StageDir/vendor" -Recurse
Copy-Item -Path "client-admin/dist" -Destination "$StageDir/admin" -Recurse

tar -czf $TarFile -C $StageDir .

scp -o StrictHostKeyChecking=no $TarFile "${User}@${ServerIP}:/tmp/$TarFile"
scp -o StrictHostKeyChecking=no "nginx_final.conf" "${User}@${ServerIP}:/tmp/nginx_final.conf"

Write-Host "=== 3. Deploying on Server ===" -ForegroundColor Cyan

# Note: We use backtick ` for escaping in PowerShell double-quoted string
$RemoteScript = @"
echo "--- Deploying ---"
# Clean Dirs
rm -rf /var/www/html/staging.resortwala.com/*
rm -rf /var/www/html/stagingvendor.resortwala.com/*
rm -rf /var/www/html/stagingadmin.resortwala.com/*

mkdir -p /var/www/html/staging.resortwala.com
mkdir -p /var/www/html/stagingvendor.resortwala.com
mkdir -p /var/www/html/stagingadmin.resortwala.com

# Extract
tar -xzf /tmp/$TarFile -C /tmp
cp -r /tmp/customer/* /var/www/html/staging.resortwala.com/
cp -r /tmp/vendor/* /var/www/html/stagingvendor.resortwala.com/
cp -r /tmp/admin/* /var/www/html/stagingadmin.resortwala.com/

chown -R www-data:www-data /var/www/html

# Nginx Config
# Use \`$ for Bash variables to prevent PowerShell interpolation
PHP_VER=\`$(ls /var/run/php/php*-fpm.sock | grep -oP 'php\d\.\d' | head -n 1)
sed -i "s/php8.2/`$PHP_VER/g" /tmp/nginx_final.conf

# Force Install Default
rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/sites-available/*
mv /tmp/nginx_final.conf /etc/nginx/sites-available/default
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

nginx -t
# Use \`$? to prevent PowerShell from replacing it with 'True/False'
if [ `$? -eq 0 ]; then
    systemctl restart nginx
    echo "SUCCESS: Deployment Complete"
else
    echo "ERROR: Nginx Config Invalid"
fi

rm -rf /tmp/customer /tmp/vendor /tmp/admin /tmp/$TarFile
"@

$RemoteScript = $RemoteScript -replace "`r`n", "`n"
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteScript"

Write-Host "DONE."
Write-Host "Customer: http://${ServerIP}/"
Write-Host "Vendor:   http://${ServerIP}/vendor/"
Write-Host "Admin:    http://${ServerIP}/admin/"
Write-Host "API:      http://${ServerIP}/api/ping"
