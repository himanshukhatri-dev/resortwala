# ResortWala Local Development Start Script

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting ResortWala Development Servers" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start SSH Tunnel for Staging Database
Write-Host "Opening SSH Tunnel to Staging Database (Port 3307)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ssh -N -L 3307:127.0.0.1:3306 root@77.37.47.243"

# 2. Sync Local Environment
Write-Host "Syncing environment files..." -ForegroundColor Yellow
Copy-Item api/.env.local api/.env
Copy-Item client-customer/.env.local client-customer/.env
Copy-Item client-vendor/.env.local client-vendor/.env
Copy-Item client-admin/.env.local client-admin/.env

# 3. Start Docker Containers
Write-Host "Starting Local Docker Services..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d

# Helper to start terminal with updated path
$pathCommand = "`$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User');"

# 2. Start Laravel API
Write-Host "Starting Laravel API on http://local.resortwala.com/api ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$pathCommand cd api; php artisan serve --host=0.0.0.0 --port=8000"

# 3. Start Customer App
Write-Host "Starting Customer App on http://local.resortwala.com ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client-customer; npm run dev"

# 4. Start Vendor App
Write-Host "Starting Vendor App on http://local.resortwala.com/vendor ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client-vendor; npm run dev"

# 5. Start Admin App
Write-Host "Starting Admin App on http://local.resortwala.com/admin ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client-admin; npm run dev"

Write-Host ""
Write-Host "All servers are starting in separate windows." -ForegroundColor Yellow
Write-Host "Keep this window open to manage Docker or press Ctrl+C to stop this script." -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to see the status of containers..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
docker-compose -f docker-compose.local.yml ps
