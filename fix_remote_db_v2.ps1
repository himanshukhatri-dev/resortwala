<#
.SYNOPSIS
    Fixes the DB_HOST mismatch on the remote server by switching to 'localhost'
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root",
    [string]$RemotePath = "/var/www/html/stagingapi.resortwala.com"
)

Write-Host "Patching DB connection to localhost..." -ForegroundColor Cyan

# Command to replace DB_HOST 
$RemoteCmd = "cd $RemotePath && " +
"sed -i 's/DB_HOST=127.0.0.1/DB_HOST=localhost/g' .env && " +
"sed -i 's/DB_HOST=host.docker.internal/DB_HOST=localhost/g' .env && " +
"php artisan config:clear && " +
"php artisan cache:clear"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCmd"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: DB_HOST set to localhost." -ForegroundColor Green
}
else {
    Write-Error "Failed to execute fix on server."
}
