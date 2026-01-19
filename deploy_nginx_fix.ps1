# Deploy Nginx Configuration to ResortWala.com
$ServerIP = "77.37.47.243"
$User = "root"
$LocalConfig = "nginx_fixed_prod.conf"
$RemotePath = "/etc/nginx/sites-available/resortwala"
$EnabledPath = "/etc/nginx/sites-enabled/resortwala"

Write-Host "Uploading Nginx configuration..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no $LocalConfig "${User}@${ServerIP}:${RemotePath}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Configuration uploaded successfully." -ForegroundColor Green
    
    Write-Host "Cleaning up old configurations and enabling new one..." -ForegroundColor Yellow
    $RemoteCmd = "rm -f /etc/nginx/sites-enabled/default && ln -sf $RemotePath $EnabledPath && nginx -t && systemctl reload nginx"
    ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" $RemoteCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Nginx reloaded successfully!" -ForegroundColor Green
    }
    else {
        Write-Error "Failed to reload Nginx. Please check server logs."
    }
}
else {
    Write-Error "Failed to upload configuration via SCP."
}
