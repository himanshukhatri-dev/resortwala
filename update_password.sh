#!/bin/bash
NEW_PASS="ResortWala_Staging_Update_2026!"
DB_USER="resortwala_staging"
ENV_FILE="/var/www/html/stagingapi.resortwala.com/.env"

echo "1. Updating MySQL User Password..."
mysql -u root <<EOF
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${NEW_PASS}';
FLUSH PRIVILEGES;
EOF

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to update MySQL password."
    exit 1
fi

echo "2. Updating .env file..."
# Use sed to replace the password line
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${NEW_PASS}/" "$ENV_FILE"

echo "3. Clearing Laravel Config Cache..."
cd /var/www/html/stagingapi.resortwala.com
php artisan config:clear
php artisan cache:clear

echo "SUCCESS: Password updated and cache cleared."
