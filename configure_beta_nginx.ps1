<#
.SYNOPSIS
    Updates Nginx configuration to handle beta.resortwala.com and resortwala.com (Coming Soon)
#>

param (
    [string]$ServerIP = "72.61.242.42",
    [string]$User = "root"
)

Write-Host "Configuring Nginx for Beta and Main Domain..." -ForegroundColor Cyan

# Define Nginx Config
# We use a separate file 'resortwala_production' to avoid messing up the 'default' staging config if possible,
# or we can append/include. But for simplicity and robustness, let's just make a new config file.

$RemoteScript = @"
cat > /etc/nginx/sites-available/resortwala_beta <<EOF
# 1. Beta Environment (Customer App)
server {
    listen 80;
    server_name beta.resortwala.com;
    
    root /var/www/html/beta.resortwala.com;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}

# 2. Main Domain (Coming Soon)
server {
    listen 80;
    server_name resortwala.com www.resortwala.com;

    root /var/www/html/resortwala.com;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable the site (symlink)
ln -sf /etc/nginx/sites-available/resortwala_beta /etc/nginx/sites-enabled/resortwala_beta

# Test and Reload
nginx -t && systemctl reload nginx
"@

ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteScript"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Nginx updated for Beta and Main domains." -ForegroundColor Green
    Write-Host "NOTE: Ensure DNS A Records point to $ServerIP" -ForegroundColor Yellow
}
else {
    Write-Error "Failed to update Nginx configuration."
}
