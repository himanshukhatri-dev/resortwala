$ServerIP = "72.61.242.42"
$User = "root"

Write-Host "Connecting to $ServerIP to increase upload limits (Attempt 2)..." -ForegroundColor Cyan

# Define commands as single lines to avoid CRLF issues
$Commands = @(
    "echo '--- Updating PHP Limits ---'",
    "find /etc/php -name php.ini -exec sed -i 's/upload_max_filesize = .*/upload_max_filesize = 100M/' {} +",
    "find /etc/php -name php.ini -exec sed -i 's/post_max_size = .*/post_max_size = 100M/' {} +",
    
    "echo '--- Updating Nginx Limits ---'",
    "sed -i 's/client_max_body_size .*/client_max_body_size 100M;/' /etc/nginx/nginx.conf || echo 'client_max_body_size not found to replace'",
    "if ! grep -q 'client_max_body_size' /etc/nginx/nginx.conf; then sed -i '/http {/a \ \ \ \ client_max_body_size 100M;' /etc/nginx/nginx.conf; fi",
    
    "echo '--- Restarting Services ---'",
    "systemctl restart php8.1-fpm 2>/dev/null || true",
    "systemctl restart php8.2-fpm 2>/dev/null || true",
    "systemctl restart php8.3-fpm 2>/dev/null || true",
    "systemctl restart php7.4-fpm 2>/dev/null || true",
    "systemctl restart nginx",
    "echo 'DONE'"
)

# Join commands with && or ; to execute them sequentially
$RemoteCmd = $Commands -join " ; "

ssh -o StrictHostKeyChecking=no ${User}@${ServerIP} "$RemoteCmd"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success: Server limits configuration script executed." -ForegroundColor Green
}
else {
    Write-Host "Error: Failed to execute server script." -ForegroundColor Red
}
