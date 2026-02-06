# ResortWala Unified Local Start Script

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting ResortWala Unified Environment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start SSH Tunnel for Staging Database
$sshRunning = Get-Process ssh -ErrorAction SilentlyContinue
if (-not $sshRunning) {
    Write-Host "Opening SSH Tunnel to Staging Database (Port 3307)..." -ForegroundColor Yellow
    # Using specific user for SSH if needed, assuming key is loaded or passwordless
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "ssh -N -L 3307:127.0.0.1:3306 root@77.37.47.243"
    Start-Sleep -Seconds 5
}
else {
    Write-Host "SSH Tunnel appears to be running." -ForegroundColor Green
}

# 2. Sync Local Environment Files
Write-Host "Syncing environment files..." -ForegroundColor Yellow
if (Test-Path "api\.env.local") { Copy-Item -Path api\.env.local -Destination api\.env -Force }
if (Test-Path "client-customer\.env.local") { Copy-Item -Path client-customer\.env.local -Destination client-customer\.env -Force }
if (Test-Path "client-vendor\.env.local") { Copy-Item -Path client-vendor\.env.local -Destination client-vendor\.env -Force }
if (Test-Path "client-admin\.env.local") { Copy-Item -Path client-admin\.env.local -Destination client-admin\.env -Force }

# 3. Start Docker Containers (Unified)
Write-Host "Starting Docker Containers (Gateway + API + Frontends)..." -ForegroundColor Yellow

# Ensure we are using the unified env file for variable substitution
# We use --remove-orphans to clean up any old 'local.yml' containers
docker-compose --env-file .env.unified -f docker-compose.unified.yml up -d --remove-orphans

Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Local Environment is Running!" -ForegroundColor Green
Write-Host "Gateway:  http://local.resortwala.com" -ForegroundColor Cyan
Write-Host "API:      http://local.resortwala.com/api" -ForegroundColor Cyan
Write-Host "Customer: http://local.resortwala.com" -ForegroundColor Cyan
Write-Host "Vendor:   http://local.resortwala.com/vendor" -ForegroundColor Cyan
Write-Host "Admin:    http://local.resortwala.com/admin" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Logs: docker-compose -f docker-compose.unified.yml logs -f"
Write-Host "Stop: docker-compose -f docker-compose.unified.yml down"
Write-Host ""
Write-Host "Press any key to check container status..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
docker-compose --env-file .env.unified -f docker-compose.unified.yml ps
