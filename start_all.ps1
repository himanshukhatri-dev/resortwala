$ErrorActionPreference = "Stop"

Write-Host "Starting ResortWala Docker Environment..." -ForegroundColor Green

# 1. Start Docker Containers
Write-Host "Step 1: Starting Docker Containers..." -ForegroundColor Cyan
docker-compose down
docker-compose up -d --build db api api_web adminer
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker containers. Ensure Docker Desktop is running."
}

# 2. Check for Laravel API and Initialize if Empty
if (-not (Test-Path ".\api\composer.json")) {
    Write-Host "Step 2: Initializing Laravel API (First Run)..." -ForegroundColor Yellow
    Write-Host "This main take a few minutes..."
    
    # Wait for DB to be potentially ready (basic wait)
    Start-Sleep -Seconds 10
    
    # Run the init commands inside the container
    docker-compose exec -T api composer create-project laravel/laravel . --prefer-dist
    docker-compose exec -T api chown -R www-data:www-data /var/www/storage
}
else {
    Write-Host "Step 2: Laravel API already initialized." -ForegroundColor Green
}

# 3. Start Customer App
Write-Host "Step 3: Starting Customer Frontend..." -ForegroundColor Cyan
if (-not (Test-Path ".\client-customer\node_modules")) {
    Write-Host "Installing Customer dependencies..."
    Start-Process -FilePath "npm.cmd" -ArgumentList "install" -WorkingDirectory ".\client-customer" -Wait -NoNewWindow
}
$customerProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev -- --port 3003 --host" -WorkingDirectory ".\client-customer" -PassThru -NoNewWindow
Write-Host "Customer App started (PID: $($customerProcess.Id))"

# 4. Start Vendor App
Write-Host "Step 4: Starting Vendor Frontend..." -ForegroundColor Cyan
if (-not (Test-Path ".\client-vendor\node_modules")) {
    Write-Host "Installing Vendor dependencies..."
    Start-Process -FilePath "npm.cmd" -ArgumentList "install" -WorkingDirectory ".\client-vendor" -Wait -NoNewWindow
}
$vendorProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev -- --port 3002 --host" -WorkingDirectory ".\client-vendor" -PassThru -NoNewWindow
Write-Host "Vendor App started (PID: $($vendorProcess.Id))"

# 4.5. Start Admin App
Write-Host "Step 4.5: Starting Admin Frontend..." -ForegroundColor Cyan
if (-not (Test-Path ".\client-admin\node_modules")) {
    Write-Host "Installing Admin dependencies..."
    Start-Process -FilePath "npm.cmd" -ArgumentList "install" -WorkingDirectory ".\client-admin" -Wait -NoNewWindow
}
$adminProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory ".\client-admin" -PassThru -NoNewWindow
Write-Host "Admin App started (PID: $($adminProcess.Id))"

# 5. Launch Browser
Write-Host "Step 5: Launching Browsers..." -ForegroundColor Green
Start-Sleep -Seconds 5
Start-Process "http://localhost:8000"
Start-Process "http://localhost:3002"
Start-Process "http://localhost:3003"
Start-Process "http://localhost:3004"

Write-Host "All services started!" -ForegroundColor Green
Write-Host "Press any key to stop the frontend servers and exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Process -Id $customerProcess.Id -ErrorAction SilentlyContinue
Stop-Process -Id $vendorProcess.Id -ErrorAction SilentlyContinue
Stop-Process -Id $adminProcess.Id -ErrorAction SilentlyContinue
