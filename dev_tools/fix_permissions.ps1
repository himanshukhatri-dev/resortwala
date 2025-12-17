# ==========================================
# Fix IIS Permissions Script
# Run this ON THE SERVER (As Administrator)
# ==========================================

$Sites = @(
    "C:\inetpub\staging.resortwala.com", 
    "C:\inetpub\stagingadmin.resortwala.com", 
    "C:\inetpub\stagingapi.resortwala.com"
)

Write-Host "Fixing Permissions for IIS..." -ForegroundColor Cyan

foreach ($path in $Sites) {
    if (Test-Path $path) {
        Write-Host "Processing: $path"
        
        # Grant Read & Execute to IIS_IUSRS (The group for all IIS worker processes)
        # /T = Recursive
        # /Q = Quiet
        icacls $path /grant "Builtin\IIS_IUSRS:(OI)(CI)RX" /T
        
        # Also Grant to IUSR (Anonymous Authentication User)
        icacls $path /grant "IUSR:(OI)(CI)RX" /T
        
        Write-Host "   [OK] Permissions updated." -ForegroundColor Green
    }
    else {
        Write-Host "   [MISSING] Path not found: $path" -ForegroundColor Red
    }
}

Write-Host "Done. Try refreshing the websites." -ForegroundColor Yellow
