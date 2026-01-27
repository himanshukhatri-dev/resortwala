
param (
    [string]$ServerIP = "77.37.47.243",
    [string]$User = "root"
)

$RemoteBase = "/var/www/html/resortwala_v2"
$OpsLocalPath = "$PSScriptRoot\dev_tools"

Write-Host "Starting ResortWala CI/CD Bootstrap on $ServerIP..." -ForegroundColor Cyan

# 1. Create Remote Directory
Write-Host "Creating remote directories..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "mkdir -p ${RemoteBase}/dev_tools"

# 2. Compress dev_tools
Write-Host "Compressing dev_tools..." -ForegroundColor Yellow
$TarPath = "$PSScriptRoot\dev_tools.tar.gz"
tar -czf "$TarPath" -C "$PSScriptRoot" dev_tools

# 3. Upload
Write-Host "Uploading dev_tools..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no "$TarPath" "${User}@${ServerIP}:${RemoteBase}/"

# 4. Extract & Fix Permissions
Write-Host "Extracting and setting permissions..." -ForegroundColor Yellow
$RemoteCmd = "
    tar -xzf ${RemoteBase}/dev_tools.tar.gz -C ${RemoteBase} && 
    chmod +x ${RemoteBase}/dev_tools/ops/*.sh
"
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteCmd"

# 5. Run Setup Scripts
Write-Host "Running Atomic Structure Setup..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "bash ${RemoteBase}/dev_tools/ops/setup_atomic_structure.sh"

Write-Host "---------------------------------------------------"
Write-Host "Bootstrap Complete." -ForegroundColor Green
Write-Host "Use 'ssh ${User}@${ServerIP}' to verify."
Write-Host "To install Jenkins, run: bash ${RemoteBase}/dev_tools/ops/install_jenkins.sh"
Write-Host "---------------------------------------------------"

# Cleanup
if (Test-Path $TarPath) { Remove-Item $TarPath }
