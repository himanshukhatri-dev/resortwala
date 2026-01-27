#!/bin/bash
# ResortWala Deployment Script
# Deploys master branch to beta, release branch to production
# Runs directly on the server - pulls from Git instead of uploading files

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="77.37.47.243"
REPO_URL="git@github.com:himanshukhatri-dev/resortwala.git"

# Deployment paths
BETA_CUSTOMER_PATH="/var/www/html/staging.resortwala.com"
BETA_VENDOR_PATH="/var/www/html/stagingvendor.resortwala.com"
BETA_ADMIN_PATH="/var/www/html/stagingadmin.resortwala.com"
BETA_API_PATH="/var/www/html/stagingapi.resortwala.com"

PROD_CUSTOMER_PATH="/var/www/html/resortwala.com"
PROD_VENDOR_PATH="/var/www/html/vendor.resortwala.com"
PROD_ADMIN_PATH="/var/www/html/admin.resortwala.com"
PROD_API_PATH="/var/www/html/api.resortwala.com"

# Temporary clone directory
TEMP_DIR="/tmp/resortwala_deploy_$(date +%Y%m%d_%H%M%S)"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to deploy frontend app
deploy_frontend() {
    local SOURCE_DIR=$1
    local DEST_PATH=$2
    local APP_NAME=$3
    
    print_status "Deploying $APP_NAME..."
    
    # Build the app
    cd "$SOURCE_DIR"
    print_status "Installing dependencies for $APP_NAME..."
    npm install
    
    print_status "Building $APP_NAME..."
    npm run build
    
    # Backup current deployment
    if [ -d "$DEST_PATH" ]; then
        print_status "Backing up current $APP_NAME..."
        tar -czf "${DEST_PATH}_backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$DEST_PATH" .
    fi
    
    # Deploy new build
    print_status "Deploying $APP_NAME to $DEST_PATH..."
    mkdir -p "$DEST_PATH"
    
    # Clear old files (except .env if exists)
    find "$DEST_PATH" -mindepth 1 ! -name '.env' -delete
    
    # Copy new build
    cp -r dist/* "$DEST_PATH/"
    
    print_success "$APP_NAME deployed successfully!"
}

# Function to deploy Laravel API
deploy_api() {
    local SOURCE_DIR=$1
    local DEST_PATH=$2
    local ENV_NAME=$3
    
    print_status "Deploying API ($ENV_NAME)..."
    
    # Backup current deployment
    if [ -d "$DEST_PATH" ]; then
        print_status "Backing up current API..."
        tar -czf "${DEST_PATH}_backup_$(date +%Y%m%d_%H%M%S).tar.gz" \
            --exclude="$DEST_PATH/storage" \
            --exclude="$DEST_PATH/.env" \
            -C "$DEST_PATH" .
    fi
    
    # Create destination if not exists
    mkdir -p "$DEST_PATH"
    
    # Preserve .env and storage
    if [ -f "$DEST_PATH/.env" ]; then
        cp "$DEST_PATH/.env" "/tmp/.env.backup"
    fi
    
    if [ -d "$DEST_PATH/storage" ]; then
        mv "$DEST_PATH/storage" "/tmp/storage.backup"
    fi
    
    # Clear old files
    find "$DEST_PATH" -mindepth 1 ! -name '.env' ! -path "$DEST_PATH/storage" ! -path "$DEST_PATH/storage/*" -delete
    
    # Copy new code
    print_status "Copying API files..."
    rsync -av --exclude='.git' --exclude='node_modules' --exclude='vendor' --exclude='.env' "$SOURCE_DIR/" "$DEST_PATH/"
    
    # Restore .env and storage
    if [ -f "/tmp/.env.backup" ]; then
        cp "/tmp/.env.backup" "$DEST_PATH/.env"
        rm "/tmp/.env.backup"
    fi
    
    if [ -d "/tmp/storage.backup" ]; then
        rm -rf "$DEST_PATH/storage"
        mv "/tmp/storage.backup" "$DEST_PATH/storage"
    fi
    
    # Install composer dependencies
    cd "$DEST_PATH"
    print_status "Installing composer dependencies..."
    export COMPOSER_ALLOW_SUPERUSER=1
    composer install --no-dev --optimize-autoloader --no-interaction
    
    # Set permissions
    print_status "Setting permissions..."
    chown -R www-data:www-data "$DEST_PATH"
    chmod -R 755 "$DEST_PATH"
    chmod -R 775 "$DEST_PATH/storage"
    chmod -R 775 "$DEST_PATH/bootstrap/cache"
    
    # Clear Laravel cache
    print_status "Clearing Laravel cache..."
    php artisan config:clear
    php artisan cache:clear
    php artisan route:clear
    php artisan view:clear
    
    # Run migrations (optional, uncomment if needed)
    # php artisan migrate --force
    
    print_success "API deployed successfully!"
}

# Main deployment function
deploy() {
    local ENVIRONMENT=$1
    local BRANCH=$2
    local COMPONENT=$3
    
    print_status "========================================="
    print_status "ResortWala Deployment"
    print_status "Environment: $ENVIRONMENT"
    print_status "Branch: $BRANCH"
    print_status "Component: $COMPONENT"
    print_status "========================================="
    
    # Clone repository
    print_status "Cloning repository..."
    git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$TEMP_DIR"
    
    if [ $? -ne 0 ]; then
        print_error "Failed to clone repository"
        exit 1
    fi
    
    cd "$TEMP_DIR"
    
    if [ "$ENVIRONMENT" == "beta" ]; then
        # Deploy to Beta/Staging
        print_status "Deploying to BETA environment..."
        
        if [ "$COMPONENT" == "customer" ] || [ "$COMPONENT" == "all" ]; then
            deploy_frontend "$TEMP_DIR/client-customer" "$BETA_CUSTOMER_PATH" "Customer App (Beta)"
        fi
        
        if [ "$COMPONENT" == "vendor" ] || [ "$COMPONENT" == "all" ]; then
            deploy_frontend "$TEMP_DIR/client-vendor" "$BETA_VENDOR_PATH" "Vendor App (Beta)"
        fi
        
        if [ "$COMPONENT" == "admin" ] || [ "$COMPONENT" == "all" ]; then
            deploy_frontend "$TEMP_DIR/client-admin" "$BETA_ADMIN_PATH" "Admin App (Beta)"
        fi
        
        if [ "$COMPONENT" == "api" ] || [ "$COMPONENT" == "all" ]; then
            deploy_api "$TEMP_DIR/api" "$BETA_API_PATH" "Beta"
        fi
        
        print_success "Beta deployment completed!"
        print_status "URLs:"
        print_status "  - Customer: https://beta.resortwala.com"
        print_status "  - Vendor:   https://beta.resortwala.com/vendor"
        print_status "  - Admin:    https://beta.resortwala.com/admin"
        print_status "  - API:      https://beta.resortwala.com/api"
        
    elif [ "$ENVIRONMENT" == "production" ]; then
        # Deploy to Production
        print_warning "Deploying to PRODUCTION environment..."
        read -p "Are you sure you want to deploy to production? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            print_error "Production deployment cancelled"
            exit 1
        fi
        
        if [ "$COMPONENT" == "customer" ] || [ "$COMPONENT" == "all" ]; then
            deploy_frontend "$TEMP_DIR/client-customer" "$PROD_CUSTOMER_PATH" "Customer App (Production)"
        fi
        
        if [ "$COMPONENT" == "vendor" ] || [ "$COMPONENT" == "all" ]; then
            deploy_frontend "$TEMP_DIR/client-vendor" "$PROD_VENDOR_PATH" "Vendor App (Production)"
        fi
        
        if [ "$COMPONENT" == "admin" ] || [ "$COMPONENT" == "all" ]; then
            deploy_frontend "$TEMP_DIR/client-admin" "$PROD_ADMIN_PATH" "Admin App (Production)"
        fi
        
        if [ "$COMPONENT" == "api" ] || [ "$COMPONENT" == "all" ]; then
            deploy_api "$TEMP_DIR/api" "$PROD_API_PATH" "Production"
        fi
        
        print_success "Production deployment completed!"
        print_status "URLs:"
        print_status "  - Customer: https://resortwala.com"
        print_status "  - Vendor:   https://resortwala.com/vendor"
        print_status "  - Admin:    https://resortwala.com/admin"
        print_status "  - API:      https://resortwala.com/api"
    else
        print_error "Invalid environment: $ENVIRONMENT"
        print_error "Use 'beta' or 'production'"
        exit 1
    fi
    
    # Cleanup
    print_status "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
    
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
    echo "  environment: beta | production"
    echo "  branch: master | release"
    echo "  component: customer | admin | vendor | api | all"
    echo ""
    echo "Examples:"
    echo "  $0 beta master all           # Deploy all components to beta"
    echo "  $0 beta master api           # Deploy only API to beta"
    echo "  $0 production release customer # Deploy only customer app to production"
    exit 1
fi

ENVIRONMENT=$1
BRANCH=$2
COMPONENT=$3

# Validate environment and branch combination
if [ "$ENVIRONMENT" == "beta" ] && [ "$BRANCH" != "master" ]; then
    print_warning "Beta should typically use 'master' branch, but proceeding with '$BRANCH'..."
fi

if [ "$ENVIRONMENT" == "production" ] && [ "$BRANCH" != "release" ]; then
    print_warning "Production should typically use 'release' branch, but proceeding with '$BRANCH'..."
fi

# Run deployment
deploy "$ENVIRONMENT" "$BRANCH" "$COMPONENT"
