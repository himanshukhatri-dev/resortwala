$ServerIP = "72.61.242.42"
$User = "root"

Write-Host "Connecting to $ServerIP to increase upload limits..." -ForegroundColor Cyan

$Cmd = "
    # 1. Update PHP (fpm) configuration
    # Find all php.ini files in /etc/php/*/fpm/ and update them
    find /etc/php -name php.ini | xargs sed -i 's/upload_max_filesize = .*/upload_max_filesize = 100M/'
    find /etc/php -name php.ini | xargs sed -i 's/post_max_size = .*/post_max_size = 100M/'

    # 2. Update Nginx configuration
    # Add or update client_max_body_size in nginx.conf
    if grep -q 'client_max_body_size' /etc/nginx/nginx.conf; then
        sed -i 's/client_max_body_size .*/client_max_body_size 100M;/' /etc/nginx/nginx.conf
    else
        sed -i '/http {/a \    client_max_body_size 100M;' /etc/nginx/nginx.conf
    fi

    # 3. Restart Services (Try common PHP versions)
    systemctl restart php8.1-fpm || systemctl restart php8.2-fpm || systemctl restart php8.3-fpm || systemctl restart php7.4-fpm
    systemctl restart nginx

    echo 'Server configuration updated successfully.'
"

ssh -o StrictHostKeyChecking=no ${User}@${ServerIP} $Cmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success: Server limits increased to 100M." -ForegroundColor Green
} else {
    Write-Host "Error: Failed to update server limits." -ForegroundColor Red
}
