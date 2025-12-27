<#
.SYNOPSIS
    Fixes the DB_HOST mismatch on the remote server by switching from host.docker.internal to 127.0.0.1
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root",
    [string]$RemotePath = "/var/www/html/stagingapi.resortwala.com"
)

Write-Host "Fixing DB connection on server..." -ForegroundColor Cyan

# Command to replace DB_HOST and clear cache
# using sed to verify and replace
$RemoteCmd = "cd $RemotePath && " +
"sed -i 's/DB_HOST=host.docker.internal/DB_HOST=127.0.0.1/g' .env && " +
"sed -i 's/APP_ENV=local/APP_ENV=production/g' .env && " +
"php artisan config:clear && " +
"php artisan cache:clear"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCmd"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Server configuration patched." -ForegroundColor Green
    Write-Host "DB_HOST set to 127.0.0.1. Cache cleared." -ForegroundColor Green
    Write-Host "Please try the Payment Button again." -ForegroundColor Yellow
}
else {
    Write-Error "Failed to execute fix on server."
}
