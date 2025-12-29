$ServerIP = "72.61.242.42"
$User = "root"
$RemotePath = "/var/www/html/stagingapi.resortwala.com"

# 1. Upload test_mail_send.php
Write-Host "Uploading test_mail_send.php..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no "api/test_mail_send.php" "${User}@${ServerIP}:${RemotePath}/public/test_mail_send.php"

Write-Host "Done. Open http://72.61.242.42/test_mail_send.php in your browser." -ForegroundColor Green
