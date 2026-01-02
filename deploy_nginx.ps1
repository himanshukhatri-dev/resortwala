<#
.SYNOPSIS
    Deploy Nginx Config and Coming Soon Page
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root"
)

$NginxConfig = "nginx_final_split.conf"
$ComingSoonDir = "coming_soon"
$RemoteWebRoot = "/var/www/html"

# 1. Upload Coming Soon Page
Write-Host "Uploading Coming Soon Page..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no -r $ComingSoonDir "${User}@${ServerIP}:${RemoteWebRoot}/"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload Coming Soon page"; exit }

# 2. Upload Nginx Config
Write-Host "Uploading Nginx Config..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no $NginxConfig "${User}@${ServerIP}:/tmp/default"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to upload Nginx config"; exit }

# 3. Apply Config and Reload
Write-Host "Applying Config and Reloading Nginx..." -ForegroundColor Yellow
$RemoteCmd = "
    mv /tmp/default /etc/nginx/sites-available/default &&
    nginx -t &&
    nginx -s reload
"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCmd"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Nginx Deployment SUCCESS." -ForegroundColor Green
}
else {
    Write-Host "Nginx Deployment FAILED." -ForegroundColor Red
}
