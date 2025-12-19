Write-Host "🧹 Cleaning up environment..." -ForegroundColor Yellow

# 1. Stop all related processes
Write-Host "Killing Node, PHP, and Cloudflared processes..." -ForegroundColor Cyan
Stop-Process -Name "node", "php", "cloudflared" -ErrorAction SilentlyContinue -Force

# 2. Clear Vite Caches
$apps = @("client-customer", "client-vendor", "client-admin")
foreach ($app in $apps) {
    $cachePath = "c:\Users\Himanshu\Documents\Code\resortwala\$app\node_modules\.vite"
    if (Test-Path $cachePath) {
        Write-Host "Removing Vite cache for $app..." -ForegroundColor Magenta
        Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 3. Restart Tunnel (if needed)
# Write-Host "Restarting DB Tunnel..." -ForegroundColor Green
# Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-File", "c:\Users\Himanshu\Documents\Code\resortwala\start_db_tunnel.ps1" -WindowStyle Minimized

# 4. Start All Apps
Write-Host "🚀 Starting everything fresh..." -ForegroundColor Green
& .\start_all.ps1
