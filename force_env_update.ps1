$ServerIP = "72.61.242.42"
$User = "root"
$RemotePath = "/var/www/html/stagingapi.resortwala.com"

# 1. Upload update_env.php
Write-Host "Uploading update_env.php..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no "update_env.php" "${User}@${ServerIP}:${RemotePath}/update_env.php"

# 2. Run it
Write-Host "Executing update_env.php..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "cd ${RemotePath} && php update_env.php"

# 3. Clear Cache
Write-Host "Clearing Config Cache..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "cd ${RemotePath} && php artisan config:clear && php artisan cache:clear"

Write-Host "Done." -ForegroundColor Green
