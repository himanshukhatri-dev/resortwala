$ServerIP = "77.37.47.243"
$User = "root"
$RemotePath = "/var/www/html/stagingapi.resortwala.com"

Write-Host "Restarting Staging API Services on $ServerIP..." -ForegroundColor Cyan

# 1. Restart PHP & Nginx
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "systemctl restart php8.2-fpm && systemctl restart nginx"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Services Restarted." -ForegroundColor Green
}
else {
    Write-Host "  [ERROR] Failed to restart services." -ForegroundColor Red
    exit 1
}

# 2. Clear Cache
Write-Host "Clearing Application Cache..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "cd $RemotePath && php artisan optimize:clear"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Cache Cleared." -ForegroundColor Green
}
else {
    Write-Host "  [ERROR] Failed to clear cache." -ForegroundColor Red
}

Write-Host "Staging API Restart Complete." -ForegroundColor Green
