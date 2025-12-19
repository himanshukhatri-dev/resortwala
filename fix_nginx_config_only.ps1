param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root"
)

Write-Host "=== Fixing Nginx Config (High Priority API + No Static Conflict) ===" -ForegroundColor Cyan

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

$NginxConfig | Out-File -FilePath "nginx_fix.conf" -Encoding ASCII

# Upload
scp -o StrictHostKeyChecking=no "nginx_fix.conf" "${User}@${ServerIP}:/tmp/nginx_fix.conf"

# Apply
$RemoteScript = @"
echo "--- Applying Config ---"
PHP_VER=\`ls /var/run/php/php*-fpm.sock | grep -oP 'php\d\.\d' | head -1\`
sed -i "s/php8.2/\$PHP_VER/g" /tmp/nginx_fix.conf

rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/sites-available/*

mv /tmp/nginx_fix.conf /etc/nginx/sites-available/default
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

echo "Permissions Check:"
ls -l /var/www/html/stagingvendor.resortwala.com/index.html

nginx -t
if [ \$? -eq 0 ]; then
    systemctl restart nginx
    echo "SUCCESS: Nginx Restarted"
else
    echo "ERROR: Nginx Config Invalid"
    cat /etc/nginx/sites-available/default
fi
"@

# Normalize
$RemoteScript = $RemoteScript -replace "`r`n", "`n"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteScript"
