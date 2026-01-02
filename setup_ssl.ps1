<#
.SYNOPSIS
    Install Certbot and Setup SSL
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root"
)

$RemoteCmd = "
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    
    # Request Certificates (Non-interactive)
    # Using --nginx plugin, agree to tos, no email (or dummy), redirect http->https
    
    certbot --nginx -d resortwala.com -d staging.resortwala.com -d www.resortwala.com --non-interactive --agree-tos -m admin@resortwala.com --redirect
"

$RemoteCmd = $RemoteCmd -replace "`r", ""
Write-Host "Installing Certbot and Requesting SSL Certs..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCmd"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SSL Setup SUCCESS." -ForegroundColor Green
}
else {
    Write-Host "SSL Setup FAILED." -ForegroundColor Red
}
