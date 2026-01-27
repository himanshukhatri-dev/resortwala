
param (
    [string]$ServerIP = "77.37.47.243",
    [string]$User = "root"
)

$RemoteConfPath = "/etc/nginx/sites-available/resortwala"
$LocalConf = "$PSScriptRoot\atomic_nginx.conf"

Write-Host "Uploading Nginx Config to $ServerIP..." -ForegroundColor Cyan

# 1. Upload Config
scp -o StrictHostKeyChecking=no "$LocalConf" "${User}@${ServerIP}:/tmp/atomic_nginx.conf"

# 2. Move, Fix Line Endings, and Enable
Write-Host "Applying Configuration..." -ForegroundColor Yellow
# Use single line to avoid PowerShell CRLF injection into bash
$RemoteCmd = "mv /tmp/atomic_nginx.conf $RemoteConfPath && sed -i 's/\r$//' $RemoteConfPath && ln -sfn $RemoteConfPath /etc/nginx/sites-enabled/resortwala && nginx -t && service nginx reload"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCmd"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Nginx Config Updated Successfully." -ForegroundColor Green
}
else {
    Write-Host "Nginx Update Failed." -ForegroundColor Red
}
