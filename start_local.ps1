# ResortWala Local Development Start Script

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting ResortWala Development Servers" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Docker Containers
Write-Host "Starting Database..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d

# 2. Start Laravel API
Write-Host "Starting Laravel API on http://local.resortwala.com:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; php artisan serve --host=local.resortwala.com --port=8000"

# 3. Start Customer App
Write-Host "Starting Customer App on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client-customer; npm run dev"

# 4. Start Vendor App
Write-Host "Starting Vendor App on http://localhost:5174 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client-vendor; npm run dev"

# 5. Start Admin App
Write-Host "Starting Admin App on http://localhost:5175 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client-admin; npm run dev"

Write-Host ""
Write-Host "All servers are starting in separate windows." -ForegroundColor Yellow
Write-Host "Keep this window open to manage Docker or press Ctrl+C to stop this script." -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to see the status of containers..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
docker-compose -f docker-compose.local.yml ps
