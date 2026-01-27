#!/bin/bash
# ResortWala Optimized Deployment Script
# Deploys master branch to beta, release branch to production
# Optimized for speed using persistent caching

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO_URL="git@github.com:himanshukhatri-dev/resortwala.git"
CACHE_DIR="/var/www/resortwala_cache"

# Load NVM for non-interactive shells
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    source "$NVM_DIR/nvm.sh"
    nvm use 22 > /dev/null 2>&1 || nvm use default > /dev/null 2>&1
fi

# Deployment paths
BETA_CUSTOMER_PATH="/var/www/html/staging.resortwala.com"
BETA_VENDOR_PATH="/var/www/html/stagingvendor.resortwala.com"
BETA_ADMIN_PATH="/var/www/html/stagingadmin.resortwala.com"
BETA_API_PATH="/var/www/html/stagingapi.resortwala.com"

PROD_CUSTOMER_PATH="/var/www/html/resortwala.com"
PROD_VENDOR_PATH="/var/www/html/vendor.resortwala.com"
PROD_ADMIN_PATH="/var/www/html/admin.resortwala.com"
PROD_API_PATH="/var/www/html/api.resortwala.com"

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to deploy frontend app
deploy_frontend() {
    local APP_DIR=$1    # e.g., /var/www/resortwala_cache/client-customer
    local DEST_PATH=$2   # e.g., /var/www/html/staging.resortwala.com
    local APP_NAME=$3
    
    print_status "Processing $APP_NAME..."
    cd "$APP_DIR"
    
    # Install dependencies (reusing node_modules)
    print_status "Updating dependencies for $APP_NAME..."
    npm install --legacy-peer-deps --prefer-offline --no-audit
    
    # Build the app
    print_status "Building $APP_NAME..."
    npm run build
    
    # Backup current deployment (only if DEST_PATH exists)
    if [ -d "$DEST_PATH" ]; then
        print_status "Backing up current $APP_NAME..."
        tar --exclude="*.tar.gz" -czf "${DEST_PATH}_backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$DEST_PATH" .
    fi
    
    # Deploy new build
    print_status "Syncing $APP_NAME to $DEST_PATH..."
    mkdir -p "$DEST_PATH"
    
    # Use rsync for efficiency - only copies changed files
    # --delete removes files in destination that are not in source dist/
    # --exclude='.env' ensures we don't delete the .env file in destination
    rsync -av --delete --exclude='.env' dist/ "$DEST_PATH/"
    
    print_success "$APP_NAME deployed successfully!"
}

# Function to deploy Laravel API
deploy_api() {
    local APP_DIR=$1    # e.g., /var/www/resortwala_cache/api
    local DEST_PATH=$2   # e.g., /var/www/html/stagingapi.resortwala.com
    local ENV_NAME=$3
    
    print_status "Processing API ($ENV_NAME)..."
    cd "$APP_DIR"
    
    # Install composer dependencies (reusing vendor)
    print_status "Updating composer dependencies..."
    export COMPOSER_ALLOW_SUPERUSER=1
    composer install --no-dev --optimize-autoloader --no-interaction
    
    # Backup current deployment
    if [ -d "$DEST_PATH" ]; then
        print_status "Backing up current API..."
        tar --exclude="*.tar.gz" \
            --exclude="storage" \
            --exclude=".env" \
            -czf "${DEST_PATH}_backup_$(date +%Y%m%d_%H%M%S).tar.gz" \
            -C "$DEST_PATH" .
    fi
    
    # Create destination if not exists
    mkdir -p "$DEST_PATH"
    
    # Sync core files to destination (excluding storage, .env, and large folders handled by composer)
    print_status "Syncing API files..."
    rsync -av --delete \
        --exclude='.git' \
        --exclude='.env' \
        --exclude='storage' \
        --exclude='node_modules' \
        "$APP_DIR/" "$DEST_PATH/"
    
    # Ensure storage and .env exist in destination (usually they stick around)
    cd "$DEST_PATH"
    
    # Set permissions
    print_status "Applying permissions and creating storage link..."
    chown -R www-data:www-data "$DEST_PATH"
    chmod -R 755 "$DEST_PATH"
    
    # Ensure storage folders exist and have correct permissions
    mkdir -p storage/app/public
    chmod -R 775 storage
    [ -d "bootstrap/cache" ] && chmod -R 775 bootstrap/cache
    
    # Create symbolic link for public storage
    php artisan storage:link --force || true
    
    # Run migrations
    print_status "Running database migrations..."
    php artisan migrate --force
    
    # Clear Laravel cache
    print_status "Clearing Laravel cache..."
    php artisan config:clear
    php artisan cache:clear
    php artisan route:clear
    php artisan view:clear
    
    print_success "API deployed successfully!"
}

# Main deployment function
deploy() {
    local ENVIRONMENT=$1
    local BRANCH=$2
    local COMPONENT=$3
    
    print_status "========================================="
    print_status "ResortWala Optimized Deployment"
    print_status "Environment: $ENVIRONMENT"
    print_status "Branch: $BRANCH"
    print_status "Component: $COMPONENT"
    print_status "========================================="
    
    # Ensure cache directory exists and is initialized
    if [ ! -d "$CACHE_DIR" ]; then
        print_status "Initializing cache directory..."
        mkdir -p "$CACHE_DIR"
        git clone "$REPO_URL" "$CACHE_DIR"
    fi
    
    # Update repository from Git
    print_status "Updating cache from Git..."
    cd "$CACHE_DIR"
    git fetch --all
    git reset --hard "origin/$BRANCH"
    
    if [ "$ENVIRONMENT" == "beta" ]; then
        # Deploy to Beta/Staging
        print_status "Environment: BETA"
        
        if [[ "$COMPONENT" == "customer" || "$COMPONENT" == "all" ]]; then
            deploy_frontend "$CACHE_DIR/client-customer" "$BETA_CUSTOMER_PATH" "Customer App (Beta)"
        fi
        
        if [[ "$COMPONENT" == "vendor" || "$COMPONENT" == "all" ]]; then
            deploy_frontend "$CACHE_DIR/client-vendor" "$BETA_VENDOR_PATH" "Vendor App (Beta)"
        fi
        
        if [[ "$COMPONENT" == "admin" || "$COMPONENT" == "all" ]]; then
            deploy_frontend "$CACHE_DIR/client-admin" "$BETA_ADMIN_PATH" "Admin App (Beta)"
        fi
        
        if [[ "$COMPONENT" == "api" || "$COMPONENT" == "all" ]]; then
            deploy_api "$CACHE_DIR/api" "$BETA_API_PATH" "Beta"
        fi
        
    elif [ "$ENVIRONMENT" == "production" ]; then
        # Deploy to Production
        print_warning "Environment: PRODUCTION"
        
        if [[ "$COMPONENT" == "customer" || "$COMPONENT" == "all" ]]; then
            deploy_frontend "$CACHE_DIR/client-customer" "$PROD_CUSTOMER_PATH" "Customer App (Prod)"
        fi
        
        if [[ "$COMPONENT" == "vendor" || "$COMPONENT" == "all" ]]; then
            deploy_frontend "$CACHE_DIR/client-vendor" "$PROD_VENDOR_PATH" "Vendor App (Prod)"
        fi
        
        if [[ "$COMPONENT" == "admin" || "$COMPONENT" == "all" ]]; then
            deploy_frontend "$CACHE_DIR/client-admin" "$PROD_ADMIN_PATH" "Admin App (Prod)"
        fi
        
        if [[ "$COMPONENT" == "api" || "$COMPONENT" == "all" ]]; then
            deploy_api "$CACHE_DIR/api" "$PROD_API_PATH" "Prod"
        fi
    fi
    
    # Restart PHP-FPM
    print_status "Restarting PHP-FPM..."
    systemctl restart php8.2-fpm
    
    print_success "========================================="
    print_success "Deployment completed successfully!"
    print_success "========================================="
}

# Parse command line arguments
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <environment> <branch> <component>"
    exit 1
fi

deploy "$1" "$2" "$3"
