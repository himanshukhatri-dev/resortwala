<#
.SYNOPSIS
    Updates Nginx configuration to explicitly handle resortwala.com
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root"
)

Write-Host "Configuring Nginx for resortwala.com..." -ForegroundColor Cyan

# We define the config block again, but with explicit server_name
# and we ensure we don't overwrite if it's already good, but here we just overwrite 'default'
$RemoteScript = @"
cat > /etc/nginx/sites-available/default <<EOF
server {
    listen 80 default_server;
    server_name resortwala.com www.resortwala.com _;
    
    # 1. Customer App (Root)
    root /var/www/html/staging.resortwala.com;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 2. Vendor App
    location /vendor {
        alias /var/www/html/stagingvendor.resortwala.com;
        try_files \$uri \$uri/ /vendor/index.html;
    }

    # 3. Admin App
    location /admin {
        alias /var/www/html/stagingadmin.resortwala.com;
        try_files \$uri \$uri/ /admin/index.html;
    }

    # 4. API Proxy
    location ^~ /api {
        alias /var/www/html/stagingapi.resortwala.com/public;
        try_files \$uri \$uri/ @laravel;
    }

    location @laravel {
        rewrite /api/(.*)$ /api/\$1 break;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/html/stagingapi.resortwala.com/public/index.php;
    }
}
EOF

nginx -t && systemctl restart nginx
"@

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteScript"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Nginx updated." -ForegroundColor Green
    Write-Host "IMPORTANT: You must use HTTP (http://resortwala.com), NOT HTTPS." -ForegroundColor Yellow
}
else {
    Write-Error "Failed to update Nginx."
}
