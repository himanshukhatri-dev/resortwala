# ==========================================
# Cloudflare Tunnel Launcher
# Bypasses IIS and Firewall by creating an outbound tunnel.
# ==========================================

$SitePath = "C:\inetpub\stagingapi.resortwala.com"
$PhpExe = "$SitePath\php_runtime\php.exe"
$TunnelExe = "$SitePath\cloudflared.exe"

# 1. Download Cloudflared (if missing)
if (-not (Test-Path $TunnelExe)) {
    Write-Host "Downloading Cloudflare Tunnel..." -ForegroundColor Cyan
    $Url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $Url -OutFile $TunnelExe
}

# 2. Cleanup Old Processes
Write-Host "Stopping old processes..." -ForegroundColor Yellow
Get-Process php, cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Start PHP Server (Background)
Write-Host "Starting PHP Server on Port 8888..." -ForegroundColor Green
$Job = Start-Job -ScriptBlock { 
    param($Php, $Path)
    Set-Location $Path
    & $Php -S 127.0.0.1:8888 -t public
} -ArgumentList $PhpExe, $SitePath

# 4. Start Tunnel
Write-Host "Starting Tunnel..." -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host "LOOK FOR THE URL BELOW looking like: https://xxxx.trycloudflare.com" -ForegroundColor Magenta
Write-Host "======================================================" -ForegroundColor Magenta

# Run interactively so user sees the URL
& $TunnelExe tunnel --url http://127.0.0.1:8888
