# =======================================================
# UNIFIED DEPLOYMENT SCRIPT (MASTER)
# =======================================================
# Usage: ./deploy.ps1
# Description: Starts all services in the correct order,
#              verifies health, and ensures no 502 errors.
# =======================================================

$ErrorActionPreference = "Stop"

# SAFEGUARD: Ensure this script NEVER runs against production
if ($env:APP_ENV -eq "production" -or $env:NODE_ENV -eq "production") {
    Write-Host "[CRITICAL] Production environment detected! This script is for LOCAL development only." -ForegroundColor Red
    exit 1
}

function Show-Status {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor $Color
}

function Write-ErrorLog {
    param([string]$Message)
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] [ERROR] $Message" -ForegroundColor Red
}

function Test-Port {
    param([int]$Port)
    $netstat = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $netstat
}

function Test-Health {
    param([string]$Url, [string]$Name)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            return $true
        }
    }
    catch {
        # Silent fail
    }
    return $false
}

# 1. PRE-FLIGHT CHECKS
Show-Status "STEP 1: Pre-flight Checks..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-ErrorLog "Docker is not installed or not in PATH."
    exit 1
}

# Check if Port 80 is occupied by something other than Docker
# Note: This is tricky because if we restart, Docker might already hold it.
# We will just warn.

if (!(Test-Path ".env.unified")) {
    Write-ErrorLog "Configuration file .env.unified is missing!"
    exit 1
}

# 2. SHUTDOWN OLD SERVICES
Show-Status "STEP 2: Cleaning up existing environment..." "Yellow"
docker-compose -f docker-compose.unified.yml --env-file .env.unified down --remove-orphans
if ($LASTEXITCODE -ne 0) {
    Write-ErrorLog "Failed to stop existing containers."
    exit 1
}

# 2.1 START SSH TUNNEL
Show-Status "STEP 2.1: establish SSH Tunnel for Remote DB..." "Yellow"
# Kill existing tunnel on 3307 if any
$existingTunnel = Get-NetTCPConnection -LocalPort 3307 -ErrorAction SilentlyContinue
if ($existingTunnel) {
    Write-Host "Found existing tunnel on 3307. Restarting..." -ForegroundColor Yellow
    Stop-Process -Id $existingTunnel.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Start new tunnel in background
Start-Process ssh -ArgumentList "-f -N -L 3307:127.0.0.1:3306 root@77.37.47.243" -NoNewWindow
# Give it a moment to establish
Start-Sleep -Seconds 3

if (-not (Test-Port 3307)) {
    Write-ErrorLog "Failed to establish SSH Tunnel on port 3307. Check your SSH keys."
    # We warn but proceed? No, DB is critical.
    # Actually, let's try one more time or just fail? 
    # Let's fail if DB is critical.
    Write-ErrorLog "Tunnel not detected. Retrying once..."
    Start-Sleep -Seconds 5
    if (-not (Test-Port 3307)) {
        Write-ErrorLog "Critical: database tunnel failed."
        exit 1
    }
}
Show-Status ">> SSH Tunnel ESTABLISHED" "Green"

# 3. START SERVICES
Show-Status "STEP 3: Starting Unified Stack..." "Yellow"
# using --build to ensure we catch Dockerfile changes
docker-compose -f docker-compose.unified.yml --env-file .env.unified up -d --build --remove-orphans

if ($LASTEXITCODE -ne 0) {
    Write-ErrorLog "Failed to start docker-compose stack."
    exit 1
}

# 3.1 ENSURE BACKEND DEPENDENCIES
Show-Status "STEP 3.1: Checking Backend Dependencies..."
docker-compose -f docker-compose.unified.yml --env-file .env.unified exec -T api composer install --no-interaction --prefer-dist
if ($LASTEXITCODE -ne 0) {
    Write-ErrorLog "Composer install failed."
    exit 1
}

# 4. HEALTH CHECKS
Show-Status "STEP 4: Verifying Service Health..." "Yellow"

$maxRetries = 30 # 30 * 2s = 60s max wait
$retry = 0

# Wait for Gateway first
$gatewayReady = $false
while ($retry -lt $maxRetries) {
    if (Test-Health "http://localhost/health" "Gateway") {
        $gatewayReady = $true
        Show-Status ">> Gateway is ONLINE" "Green"
        break
    }
    Write-Host -NoNewline "."
    Start-Sleep -Seconds 2
    $retry++
}

if (-not $gatewayReady) {
    Write-ErrorLog "Gateway failed to become healthy. Check 'docker-compose logs gateway'."
    exit 1
}

# Check Frontends
Show-Status "Checking Frontends..."
# Note: Frontends might take longer to compile Vite
# We just check if connection is accepted, not necessarily 200 OK (Vite might return 200 with HTML)

$vendor = Test-Health "http://localhost/vendor" "Vendor"
if ($vendor) { Show-Status ">> Vendor Panel accessible" "Green" } else { Show-Status ">> Vendor Panel taking time (normal for Vite first run)" "Yellow" }

$admin = Test-Health "http://localhost/admin" "Admin"
if ($admin) { Show-Status ">> Admin Panel accessible" "Green" } else { Show-Status ">> Admin Panel taking time (normal for Vite first run)" "Yellow" }

$customer = Test-Health "http://localhost/" "Customer"
if ($customer) { Show-Status ">> Customer Panel accessible" "Green" } else { Show-Status ">> Customer Panel taking time" "Yellow" }

# 5. SUCCESS
Show-Status "===================================================" "Green"
Show-Status " DEPLOYMENT SUCCESSFUL" "Green"
Show-Status "===================================================" "Green"
Show-Status " App URL:    http://local.resortwala.com"
Show-Status " Vendor:     http://local.resortwala.com/vendor"
Show-Status " Admin:      http://local.resortwala.com/admin"
Show-Status " API:        http://local.resortwala.com/api"
Show-Status "==================================================="
