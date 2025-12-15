# ==========================================
# API Debug Script (Run on Server)
# ==========================================
$Path = "C:\inetpub\stagingapi.resortwala.com"

Write-Host "Resetting API Config to find 500 Cause..." -ForegroundColor Cyan

# 1. Hide .env (if it exists, it might have syntax errors)
if (Test-Path "$Path\.env") {
    Rename-Item "$Path\.env" ".env.bak" -Force
    Write-Host "Renamed .env to .env.bak"
}

# 2. Hide Root web.config (might have bad rewrite)
if (Test-Path "$Path\web.config") {
    Rename-Item "$Path\web.config" "web.config.bak" -Force
    Write-Host "Renamed root web.config to web.config.bak"
}

# 3. Create a simple test file at ROOT
"<h1>Root PHP Check OK</h1>" | Out-File "$Path\root_check.php"
Write-Host "Created root_check.php"

Write-Host "Done. Check http://stagingapi.resortwala.com/root_check.php" -ForegroundColor Green
