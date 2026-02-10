<#
.SYNOPSIS
    Trigger deployment on server by pulling from Git
    
.DESCRIPTION
    This script uploads the deployment script to the server and executes it.
    The server will pull code from Git repository instead of uploading from local.
    
.PARAMETER Environment
    Deployment environment: beta or production
    
.PARAMETER Branch
    Git branch to deploy: main (for beta) or release (for production)
    
.EXAMPLE
    .\deploy_auto.ps1 -Environment beta -Branch master
    Deploys master branch to beta environment
    
.EXAMPLE
    .\deploy_auto.ps1 -Environment production -Branch release
    Deploys release branch to production environment
#>

param (
    [Parameter(Mandatory = $false)]
    [ValidateSet("beta", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("master", "release")]
    [string]$Branch,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("customer", "admin", "vendor", "api", "all")]
    [string]$Component,
    
    [string]$ServerIP = "77.37.47.243",
    [string]$User = "root",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipMigrate
)

# Interactive prompts if parameters not provided
if (-not $Environment) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "ResortWala Deployment" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Select deployment environment:" -ForegroundColor Yellow
    Write-Host "  1. Beta (Staging)" -ForegroundColor Green
    Write-Host "  2. Production" -ForegroundColor Red
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1 or 2)"
    
    switch ($choice) {
        "1" { $Environment = "beta" }
        "2" { $Environment = "production" }
        default {
            Write-Error "Invalid choice. Please enter 1 or 2."
            exit 1
        }
    }
}

if (-not $Branch) {
    Write-Host ""
    Write-Host "Select Git branch to deploy:" -ForegroundColor Yellow
    if ($Environment -eq "beta") {
        Write-Host "  1. master (recommended for beta)" -ForegroundColor Green
        Write-Host "  2. release" -ForegroundColor Gray
    }
    else {
        Write-Host "  1. beta" -ForegroundColor Gray
        Write-Host "  2. release (recommended for production)" -ForegroundColor Green
    }
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1 or 2)"
    
    switch ($choice) {
        "1" { $Branch = "master" }
        "2" { $Branch = "release" }
        default {
            Write-Error "Invalid choice. Please enter 1 or 2."
            exit 1
        }
    }
}

if (-not $Component) {
    Write-Host ""
    Write-Host "Select component to deploy:" -ForegroundColor Yellow
    Write-Host "  1. Customer App" -ForegroundColor White
    Write-Host "  2. Admin App" -ForegroundColor White
    Write-Host "  3. Vendor App" -ForegroundColor White
    Write-Host "  4. API (Laravel)" -ForegroundColor White
    Write-Host "  5. All Components" -ForegroundColor Green
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-5)"
    
    switch ($choice) {
        "1" { $Component = "customer" }
        "2" { $Component = "admin" }
        "3" { $Component = "vendor" }
        "4" { $Component = "api" }
        "5" { $Component = "all" }
        default {
            Write-Error "Invalid choice. Please enter 1-5."
            exit 1
        }
    }
}

# Validate environment and branch combination
if ($Environment -eq "beta" -and $Branch -ne "master") {
    Write-Warning "Beta environment should use 'master' branch. You specified '$Branch'."
    $confirm = Read-Host "Continue anyway? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 1
    }
}

if ($Environment -eq "production" -and $Branch -ne "release") {
    Write-Warning "Production environment should use 'release' branch. You specified '$Branch'."
    $confirm = Read-Host "Continue anyway? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "ResortWala Automated Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Component: $Component" -ForegroundColor Cyan
Write-Host "Branch: $Branch" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload deployment script to server
Write-Host "[1/3] Uploading deployment script to server..." -ForegroundColor Yellow
$deployScript = "$PSScriptRoot\deploy_from_git.sh"

if (-not (Test-Path $deployScript)) {
    Write-Error "Deployment script not found: $deployScript"
    exit 1
}

scp -o StrictHostKeyChecking=no "$deployScript" "${User}@${ServerIP}:/tmp/deploy_from_git.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload deployment script"
    exit 1
}

Write-Host "[1/3] Deployment script uploaded successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Make script executable
Write-Host "[2/3] Making script executable..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "chmod +x /tmp/deploy_from_git.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to make script executable"
    exit 1
}

Write-Host "[2/3] Script is now executable" -ForegroundColor Green
Write-Host ""

# Step 3: Execute deployment on server
Write-Host "[3/3] Executing deployment on server..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
Write-Host ""

# Fix line endings (CRLF -> LF) and then execute
$skipArg = if ($SkipMigrate) { "skip_migrate" } else { "" }
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "sed -i 's/\r$//' /tmp/deploy_from_git.sh && /bin/bash /tmp/deploy_from_git.sh $Environment $Branch $Component $skipArg"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Show URLs
if ($Environment -eq "beta") {
    Write-Host "Beta URLs:" -ForegroundColor Cyan
    Write-Host "  Customer: https://beta.resortwala.com" -ForegroundColor White
    Write-Host "  Vendor:   https://beta.resortwala.com/vendor" -ForegroundColor White
    Write-Host "  Admin:    https://beta.resortwala.com/admin" -ForegroundColor White
    Write-Host "  API:      https://beta.resortwala.com/api/properties" -ForegroundColor White
}
else {
    Write-Host "Production URLs:" -ForegroundColor Cyan
    Write-Host "  Customer: https://resortwala.com" -ForegroundColor White
    Write-Host "  Vendor:   https://resortwala.com/vendor" -ForegroundColor White
    Write-Host "  Admin:    https://resortwala.com/admin" -ForegroundColor White
    Write-Host "  API:      https://resortwala.com/api/properties" -ForegroundColor White
}


Write-Host ""
Write-Host "Deployment log saved on server at: /tmp/deploy_from_git.sh" -ForegroundColor Gray
