#!/bin/bash
# Reorganize Beta/Staging to match Production structure
# This script moves separate staging directories into a unified structure

set -e

echo "=== Reorganizing Beta/Staging Structure ==="

# Backup current structure
echo "1. Creating backup..."
tar -czf /tmp/staging_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    /var/www/html/staging.resortwala.com \
    /var/www/html/stagingapi.resortwala.com \
    /var/www/html/stagingvendor.resortwala.com \
    /var/www/html/stagingadmin.resortwala.com

echo "2. Creating new unified structure..."

# Create subdirectories if they don't exist
mkdir -p /var/www/html/staging.resortwala.com/vendor
mkdir -p /var/www/html/staging.resortwala.com/admin
mkdir -p /var/www/html/staging.resortwala.com/api

# Move API
echo "3. Moving API..."
if [ -d "/var/www/html/stagingapi.resortwala.com" ]; then
    rsync -av /var/www/html/stagingapi.resortwala.com/ /var/www/html/staging.resortwala.com/api/
    echo "   API moved successfully"
fi

# Move Vendor App
echo "4. Moving Vendor App..."
if [ -d "/var/www/html/stagingvendor.resortwala.com" ]; then
    rsync -av /var/www/html/stagingvendor.resortwala.com/ /var/www/html/staging.resortwala.com/vendor/
    echo "   Vendor app moved successfully"
fi

# Move Admin App
echo "5. Moving Admin App..."
if [ -d "/var/www/html/stagingadmin.resortwala.com" ]; then
    rsync -av /var/www/html/stagingadmin.resortwala.com/ /var/www/html/staging.resortwala.com/admin/
    echo "   Admin app moved successfully"
fi

# Set proper permissions
echo "6. Setting permissions..."
chown -R www-data:www-data /var/www/html/staging.resortwala.com/
chmod -R 755 /var/www/html/staging.resortwala.com/

# Set Laravel-specific permissions
if [ -d "/var/www/html/staging.resortwala.com/api/storage" ]; then
    chmod -R 775 /var/www/html/staging.resortwala.com/api/storage
    chmod -R 775 /var/www/html/staging.resortwala.com/api/bootstrap/cache
fi

# Create storage symlink if needed
echo "7. Creating storage symlink..."
cd /var/www/html/staging.resortwala.com/api
php artisan storage:link 2>/dev/null || echo "   Storage link already exists or failed"

# Clear Laravel cache
echo "8. Clearing Laravel cache..."
cd /var/www/html/staging.resortwala.com/api
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo ""
echo "=== Structure reorganized successfully! ==="
echo ""
echo "New structure:"
echo "/var/www/html/staging.resortwala.com/"
echo "├── index.html (Customer App)"
echo "├── vendor/ (Vendor App)"
echo "├── admin/ (Admin App)"
echo "└── api/ (Laravel API)"
echo ""
echo "Backup saved to: /tmp/staging_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
echo ""
echo "Next steps:"
echo "1. Deploy updated nginx config: scp nginx_beta.conf root@77.37.47.243:/etc/nginx/sites-available/beta_atomic"
echo "2. Reload nginx: nginx -t && systemctl reload nginx"
echo "3. Test API: curl -k https://beta.resortwala.com/api/properties"
