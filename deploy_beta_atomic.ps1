# deploy_beta_atomic.ps1
# Deploys the current codebase to the new Atomic Deployment structure on Beta
# Target: /var/www/html/staging.resortwala.com/releases/beta_initial

$ServerIP = "77.37.47.243"
$User = "root"
$BaseDir = "/var/www/html/staging.resortwala.com"
$Release = "beta_initial_$(Get-Date -Format 'yyyyMMddHHmm')"
$ReleasePath = "$BaseDir/releases/$Release"

# Paths
$Paths = @{
    "Customer" = @{ "Local" = "$PSScriptRoot/client-customer"; "Dist" = "dist" }
    "Admin"    = @{ "Local" = "$PSScriptRoot/client-admin"; "Dist" = "dist" }
    "Vendor"   = @{ "Local" = "$PSScriptRoot/client-vendor"; "Dist" = "dist" }
    "API"      = @{ "Local" = "$PSScriptRoot/api"; "Dist" = "." }
}

Write-Host ">>> Starting Atomic Beta Deployment ($Release)..." -ForegroundColor Cyan

# 1. Prepare Release Directory
Write-Host "Creating release directory: $ReleasePath..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "mkdir -p $ReleasePath"

# 2. Build and Upload Frontends
foreach ($keys in $Paths.GetEnumerator()) {
    $Name = $keys.Key
    $Config = $keys.Value
    
    if ($Name -eq "API") { 
        continue 
    }

    Write-Host "[$Name] Building..." -ForegroundColor Cyan
    Push-Location $Config.Local
    try {
        # Check if node_modules exists, else install
        if (-not (Test-Path "node_modules")) { npm install }
        npm run build
        
        # Upload
        $DistPath = Join-Path $Config.Local $Config.Dist
        Write-Host "[$Name] Uploading..." -ForegroundColor Yellow
        
        # Compress locally to speed up
        $TarFile = "$Name.tar.gz"
        tar -czf $TarFile -C $DistPath .
        
        scp -o StrictHostKeyChecking=no $TarFile "${User}@${ServerIP}:$ReleasePath/$TarFile"
        
        # Extract remotely
        if ($Name -eq "Customer") { $Dest = "$ReleasePath" } # Root
        else { $Dest = "$ReleasePath/$($Name.ToLower())" } # Subdir
        
        ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "mkdir -p $Dest && tar -xzf $ReleasePath/$TarFile -C $Dest && rm $ReleasePath/$TarFile"
        
        Remove-Item $TarFile
    }
    finally {
        Pop-Location
    }
}

# 3. Upload API
Write-Host "[API] Uploading..." -ForegroundColor Cyan
Push-Location $Paths.API.Local
$ApiTar = "api.tar.gz"
# Exclude vendor and user content
tar -czf $ApiTar --exclude='vendor' --exclude='node_modules' --exclude='.git' --exclude='storage/*.key' .
scp -o StrictHostKeyChecking=no $ApiTar "${User}@${ServerIP}:$ReleasePath/$ApiTar"
Remove-Item $ApiTar
Pop-Location

# Extract API and Setup
$RemoteApiSetup = "
    # Extract API using temp directory to ensure correct structure
    mkdir -p $ReleasePath/api_temp &&
    tar -xzf $ReleasePath/api.tar.gz -C $ReleasePath/api_temp &&
    rm $ReleasePath/api.tar.gz &&
    mv $ReleasePath/api_temp $ReleasePath/api &&
    
    # Permissions & Linking
    cd $ReleasePath/api &&
    rm -rf storage &&
    ln -s ../../../shared/storage storage &&
    
    # Permissions
    chown -R www-data:www-data . &&
    chmod -R 775 bootstrap/cache &&
    
    # Composer
    export COMPOSER_ALLOW_SUPERUSER=1 &&
    php -d memory_limit=-1 /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction
"

Write-Host "[API] Extracting and Configuring..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteApiSetup"

# 4. Finalize
Write-Host "Finalizing Release..." -ForegroundColor Cyan
$RemoteFinalize = "
    ln -sfn $ReleasePath $BaseDir/current &&
    chown -R www-data:www-data $BaseDir/current
"
ssh -o StrictHostKeyChecking=no "${User}@${ServerIP}" "$RemoteFinalize"

Write-Host "Deployment Complete! Release: $Release" -ForegroundColor Green
