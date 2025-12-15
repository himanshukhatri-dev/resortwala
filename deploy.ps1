<#
.SYNOPSIS
    Deployment script for ResortWala Staging (Optimized & Robust).
    
.DESCRIPTION
    Builds and deploys components using Zip Compression + Base64 SSH Commands:
    1. Customer Frontend (React) -> staging.resortwala.com
    2. Admin Frontend (React)    -> stagingadmin.resortwala.com
    3. API Backend (Laravel)     -> stagingapi.resortwala.com

    Prerequisites:
    - Node.js & npm installed
    - SCP installed (OpenSSH Client)
    - Credentials for Server

.NOTES
    Author: Himanshu
    Date: 2025-12-13
#>

param (
    [string]$ServerIP = "103.118.16.150",
    [string]$User = "zohaib",
    [string]$RemoteBasePath = "C:/inetpub"
)

# Configuration
$Paths = @{
    "Customer" = @{
        "LocalSource" = "$PSScriptRoot/client-customer"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/staging.resortwala.com"
        "Type"        = "React"
    }
    "Admin"    = @{
        "LocalSource" = "$PSScriptRoot/client-admin"
        "DistDir"     = "dist"
        "RemotePath"  = "$RemoteBasePath/stagingadmin.resortwala.com"
        "Type"        = "React"
    }
    "API"      = @{
        "LocalSource" = "$PSScriptRoot/api"
        "DistDir"     = "." 
        "RemotePath"  = "$RemoteBasePath/stagingapi.resortwala.com"
        "Type"        = "Laravel"
        "Excludes"    = @(".env", "node_modules", ".git", "storage/*.key", "tests") # Vendor included
    }
}

function Build-ReactApp {
    param ($Name, $Config)
    Write-Host "[$Name] Starting Build..." -ForegroundColor Cyan
    Push-Location $Config.LocalSource
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "[$Name] Installing dependencies..." -ForegroundColor Yellow
            npm install
        }
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$Name] Build Successful." -ForegroundColor Green
        }
        else {
            Write-Error "[$Name] Build Failed."
            return $false
        }
    }
    finally {
        Pop-Location
    }
    return $true
}

function Build-Laravel {
    param ($Name, $Config)
    Write-Host "[$Name] Installing Dependencies (Production)..." -ForegroundColor Cyan
    Push-Location $Config.LocalSource
    try {
        # Check if composer is installed
        if (Get-Command "composer" -ErrorAction SilentlyContinue) {
            composer install --optimize-autoloader --no-dev
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[$Name] Composer Install Successful." -ForegroundColor Green
            }
            else {
                Write-Error "[$Name] Composer Install Failed."
                return $false
            }
        }
        else {
            Write-Warning "Composer not found. Skipping dependency installation."
        }
    }
    finally {
        Pop-Location
    }
    return $true
}

function Deploy-Component {
    param ($Name, $Config)
    
    $SourcePath = Join-Path $Config.LocalSource $Config.DistDir
    
    Write-Host "[$Name] Initializing Deployment..." -ForegroundColor Cyan
    
    # Create Temp Directory for Staging
    $TempDir = Join-Path $Env:TEMP "ResortWalaDeploy_$Name"
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $TempDir | Out-Null
    
    # 1. Prepare files in Temp
    Write-Host "[$Name] Staging files..." -ForegroundColor Gray
    if ($Config.Type -eq "Laravel") {
        Copy-Item -Path "$($Config.LocalSource)/*" -Destination $TempDir -Recurse -Force
        foreach ($exclude in $Config.Excludes) {
            $Item = Join-Path $TempDir $exclude
            if (Test-Path $Item) { Remove-Item $Item -Recurse -Force }
        }
        $SourcePath = $TempDir
    }
    else {
        Copy-Item -Path "$SourcePath/*" -Destination $TempDir -Recurse -Force
        $SourcePath = $TempDir
    }

    # 2. Compress (Fast .NET)
    $ZipPath = Join-Path $Env:TEMP "deploy_package.zip"
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    
    Write-Host "[$Name] Compressing..." -ForegroundColor Yellow
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $CompressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
    [System.IO.Compression.ZipFile]::CreateFromDirectory($SourcePath, $ZipPath, $CompressionLevel, $false)
    
    # 3. Clean Remote Folder (Base64 Encoded SSH)
    Write-Host "[$Name] Cleaning Remote Directory..." -ForegroundColor Red
    Write-Host "   -> Password Prompt 1/3 (SSH Clean)" -ForegroundColor Magenta
    
    # Command: if (Test-Path 'PATH') { Get-ChildItem 'PATH' -Exclude '.env' | Remove-Item -Recurse -Force }
    $RemoteCleanScript = "if (Test-Path '$($Config.RemotePath)') { Get-ChildItem '$($Config.RemotePath)' -Exclude '.env' | Remove-Item -Recurse -Force }"
    $Bytes = [System.Text.Encoding]::Unicode.GetBytes($RemoteCleanScript)
    $EncodedClean = [Convert]::ToBase64String($Bytes)
    
    ssh "${User}@${ServerIP}" "powershell -EncodedCommand $EncodedClean"
    
    # 4. Transfer Zip
    Write-Host "[$Name] Uploading..." -ForegroundColor Cyan
    Write-Host "   -> Password Prompt 2/3 (SCP Upload)" -ForegroundColor Magenta
    
    scp "$ZipPath" "${User}@${ServerIP}:$($Config.RemotePath)/deploy_package.zip"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$Name] Extracting..." -ForegroundColor Green
        
        # 5. Unzip Remotely (Base64 Encoded SSH)
        # Command: Expand-Archive -Path 'ZIP' -Destination 'DEST' -Force; Remove-Item 'ZIP' -Force
        $RemoteUnzipScript = "Expand-Archive -Path '$($Config.RemotePath)\deploy_package.zip' -DestinationPath '$($Config.RemotePath)' -Force; Remove-Item '$($Config.RemotePath)\deploy_package.zip' -Force"
        $Bytes2 = [System.Text.Encoding]::Unicode.GetBytes($RemoteUnzipScript)
        $EncodedUnzip = [Convert]::ToBase64String($Bytes2)
        
        Write-Host "   -> Password Prompt 3/3 (SSH Unzip)" -ForegroundColor Magenta
        ssh "${User}@${ServerIP}" "powershell -EncodedCommand $EncodedUnzip"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$Name] SUCCESS." -ForegroundColor Green
        }
        else {
            Write-Host "[$Name] Extraction Failed (SSH Error)." -ForegroundColor Red
        }
    }
    else {
        Write-Error "[$Name] SCP Upload Failed."
    }
    
    # Cleanup local
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
}

# Menu
Clear-Host
Write-Host "=========================================="
Write-Host "   ResortWala Deployment Manager (v3 Final)"
Write-Host "=========================================="
Write-Host "1. Deploy Customer App (React)"
Write-Host "2. Deploy Admin App (React)"
Write-Host "3. Deploy API (Laravel)"
Write-Host "4. Deploy ALL"
Write-Host "Q. Quit"
Write-Host "=========================================="

$Selection = Read-Host "Select Option"

switch ($Selection) {
    "1" { 
        if (Build-ReactApp "Customer" $Paths.Customer) { Deploy-Component "Customer" $Paths.Customer }
    }
    "2" { 
        if (Build-ReactApp "Admin" $Paths.Admin) { Deploy-Component "Admin" $Paths.Admin }
    }
    "3" {
        if (Build-Laravel "API" $Paths.API) { Deploy-Component "API" $Paths.API }
    }
    "4" {
        if (Build-ReactApp "Customer" $Paths.Customer) { Deploy-Component "Customer" $Paths.Customer }
        if (Build-ReactApp "Admin" $Paths.Admin) { Deploy-Component "Admin" $Paths.Admin }
        if (Build-Laravel "API" $Paths.API) { Deploy-Component "API" $Paths.API }
    }
    "Q" { exit }
    Default { Write-Host "Invalid Selection" -ForegroundColor Red }
}
