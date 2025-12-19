Write-Host "Starting SSH Tunnel for Database..." -ForegroundColor Green
Write-Host "Forwarding localhost:3307 -> remote:3306" -ForegroundColor Cyan
Write-Host "Keep this window open to maintain the connection." -ForegroundColor Yellow

# Start SSH Tunnel
# -L 3307:127.0.0.1:3306 : Forward local port 3307 to remote localhost:3306
# -N : Do not execute a remote command (just forward ports)
ssh -L 3307:127.0.0.1:3306 root@72.61.242.42 -N
