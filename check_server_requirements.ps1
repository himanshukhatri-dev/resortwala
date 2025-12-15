# ==========================================
# ResortWala Server Requirement Logic Check
# Run this PowerShell script ON THE SERVER
# ==========================================

Write-Host "Checking Server Requirements..." -ForegroundColor Cyan

# 1. Check IIS
if (Get-Service W3SVC -ErrorAction SilentlyContinue) {
    Write-Host "[OK] IIS is installed." -ForegroundColor Green
}
else {
    Write-Host "[MISSING] IIS (Web Server) is not running or installed." -ForegroundColor Red
}

# 2. Check URL Rewrite Module (Crucial for React & Laravel)
$RewriteInstalled = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" -ErrorAction SilentlyContinue
if ($RewriteInstalled) {
    Write-Host "[OK] IIS URL Rewrite Module is installed." -ForegroundColor Green
}
else {
    Write-Host "[MISSING] IIS URL Rewrite Module is NOT detected." -ForegroundColor Red
    Write-Host "   -> Required for React Routes and Laravel Clean URLs."
    Write-Host "   -> Download: https://www.iis.net/downloads/microsoft/url-rewrite"
}

# 3. Check PHP (Crucial for Laravel)
if (Get-Command "php" -ErrorAction SilentlyContinue) {
    $phpVersion = php -r "echo PHP_VERSION;"
    Write-Host "[OK] PHP is installed (Version: $phpVersion)." -ForegroundColor Green
    
    # Check Extensions
    $exts = php -m
    $required = @("openssl", "pdo", "pdo_mysql", "mbstring", "fileinfo", "curl")
    foreach ($req in $required) {
        if ($exts -contains $req) {
            Write-Host "   - Extension '$req': OK" -ForegroundColor Gray
        }
        else {
            Write-Host "   - Extension '$req': MISSING" -ForegroundColor Red
        }
    }
}
else {
    Write-Host "[MISSING] PHP is not in the system PATH." -ForegroundColor Red
    Write-Host "   -> Ensure PHP is installed and registered with IIS (via PHP Manager or FastCGI)."
}

# 4. Check Access to Folders
$Paths = @("C:\inetpub\staging.resortwala.com", "C:\inetpub\stagingadmin.resortwala.com", "C:\inetpub\stagingapi.resortwala.com")
foreach ($path in $Paths) {
    if (Test-Path $path) {
        Write-Host "[OK] Directory exists: $path" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] Directory missing: $path (Will be created by deploy script if permissions allow)" -ForegroundColor Yellow
    }
}
