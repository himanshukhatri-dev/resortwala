<#
.SYNOPSIS
    Fixes the Email/SMTP settings on the remote server which were overwritten by the local .env upload.
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root",
    [string]$RemotePath = "/var/www/html/stagingapi.resortwala.com"
)

Write-Host "Restoring Production Email Settings on Server..." -ForegroundColor Cyan

# We use sed to replace the lines. 
# Notes:
# - We assume the keys exist (since they were in the local env, just with wrong values)
# - If keys are missing, sed won't add them, but standard Laravel env usually has them.
# - Password 'Shehnaaz1959' is safe for sed (no special chars).

$RemoteCmd = "cd $RemotePath && " +
"sed -i 's/MAIL_MAILER=.*/MAIL_MAILER=smtp/g' .env && " +
"sed -i 's/MAIL_HOST=.*/MAIL_HOST=smtpout.secureserver.net/g' .env && " +
"sed -i 's/MAIL_PORT=.*/MAIL_PORT=465/g' .env && " +
"sed -i 's/MAIL_USERNAME=.*/MAIL_USERNAME=support@resortwala.com/g' .env && " +
"sed -i 's/MAIL_PASSWORD=.*/MAIL_PASSWORD=Shehnaaz1959/g' .env && " +
"sed -i 's/MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=ssl/g' .env && " +
"sed -i 's/MAIL_FROM_ADDRESS=.*/MAIL_FROM_ADDRESS=support@resortwala.com/g' .env && " +
"php artisan config:clear && " +
"php artisan cache:clear"

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCmd"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Email settings restored." -ForegroundColor Green
    Write-Host "You can now retry the OTP request." -ForegroundColor Yellow
}
else {
    Write-Error "Failed to update email settings."
}
