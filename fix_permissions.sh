#!/bin/bash

# Define the path
PROJECT_PATH="/var/www/html/stagingapi.resortwala.com"

echo "Fixing permissions for $PROJECT_PATH..."

# 1. Change ownership to www-data (Web Server User)
chown -R www-data:www-data "$PROJECT_PATH"

# 2. Fix directory and file permissions
find "$PROJECT_PATH" -type f -exec chmod 644 {} \;
find "$PROJECT_PATH" -type d -exec chmod 755 {} \;

# 3. Ensure storage and cache are writable
chmod -R 775 "$PROJECT_PATH/storage"
chmod -R 775 "$PROJECT_PATH/bootstrap/cache"

echo "Permissions fixed."

# 4. Clear Laravel Caches (as www-data to avoid root ownership issues)
echo "Clearing Laravel caches..."
cd "$PROJECT_PATH"
sudo -u www-data php artisan optmize:clear
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan route:clear

# 5. Restart PHP Service
echo "Restarting PHP-FPM..."
# Try to detect version, default to 8.2 or 8.1
if systemctl list-units --full -all | grep -q "php8.2-fpm.service"; then
    service php8.2-fpm restart
    echo "Restarted php8.2-fpm"
elif systemctl list-units --full -all | grep -q "php8.1-fpm.service"; then
    service php8.1-fpm restart
    echo "Restarted php8.1-fpm"
else
    echo "Could not auto-detect PHP version. Please restart manually (e.g., service php-fpm restart)"
fi

echo "Done! Please try the URL again."
