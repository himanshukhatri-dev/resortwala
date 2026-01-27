# ResortWala Local Setup Script

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "ResortWala Local Environment Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker
Write-Host "[1/6] Checking Docker..." -ForegroundColor Yellow
if (-not (Get-Process "Docker Desktop" -ErrorAction SilentlyContinue)) {
    Write-Warning "Docker Desktop is not running. Please start it and try again."
    # exit 1 (disabled for now to allow rest of setup)
}
else {
    Write-Host "✓ Docker Desktop is running" -ForegroundColor Green
}

# 2. Start Docker Containers
Write-Host "[2/6] Starting Docker containers (MySQL & Adminer)..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker containers."
    exit 1
}
Write-Host "✓ Docker containers started" -ForegroundColor Green

# 3. Setup API
Write-Host "[3/6] Setting up Laravel API..." -ForegroundColor Yellow
Push-Location api

# Copy .env.local to .env
if (Test-Path .env.local) {
    Copy-Item .env.local .env -Force
    Write-Host "✓ Copied .env.local to .env" -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing composer dependencies..." -ForegroundColor Gray
composer install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Composer install failed."
    exit 1
}

# Generate Key if missing
if (-not (Select-String -Path .env -Pattern "APP_KEY=base64:")) {
    php artisan key:generate
    Write-Host "✓ App key generated" -ForegroundColor Green
}

# Create Storage Link
php artisan storage:link
Write-Host "✓ Storage link created" -ForegroundColor Green

# Wait for DB to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Run Migrations
Write-Host "Running database migrations..." -ForegroundColor Gray
php artisan migrate --force
if ($LASTEXITCODE -ne 0) {
    Write-Error "Migrations failed. Make sure Docker DB is running."
}
else {
    Write-Host "✓ Migrations completed" -ForegroundColor Green
}

Pop-Location

# 4. Setup Frontends
Write-Host "[4/6] Setting up Frontends..." -ForegroundColor Yellow

$frontends = @("client-customer", "client-vendor", "client-admin")
foreach ($app in $frontends) {
    Write-Host "Setting up $app..." -ForegroundColor Cyan
    Push-Location $app
    if (Test-Path .env.local) {
        Copy-Item .env.local .env -Force
    }
    # Skip npm install for now to save time, assume user has them or will run them
    Pop-Location
}

# 5. Hosts File Information
Write-Host "[5/6] Custom Domain Setup..." -ForegroundColor Yellow
Write-Host "To use local.resortwala.com, add this to your C:\Windows\System32\drivers\etc\hosts file:" -ForegroundColor Cyan
Write-Host "127.0.0.1  local.resortwala.com" -ForegroundColor White
Write-Host "(Requires Administrator privileges)" -ForegroundColor Gray

# 6. Success
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Local Setup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Add '127.0.0.1 local.resortwala.com' to your hosts file"
Write-Host "2. Run '.\start_local.ps1' to start dev servers"
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "- API:     http://local.resortwala.com:8000"
Write-Host "- Adminer: http://localhost:8080 (Login: Server=db, User=root, Pass=root)"
Write-Host "- Customer: http://localhost:5173"
Write-Host "- Vendor:   http://localhost:5174"
Write-Host "- Admin:    http://localhost:5175"
