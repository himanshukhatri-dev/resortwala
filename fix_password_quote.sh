#!/bin/bash
PASS="ResortWala_Staging_Update_2026!"
QUOTED_PASS="\"ResortWala_Staging_Update_2026!\""
ENV_FILE="/var/www/html/stagingapi.resortwala.com/.env"

echo "Checking MySQL User..."
mysql -u root -e "SELECT User, Host FROM mysql.user WHERE User='resortwala_staging';"

echo "Resetting Password (just in case)..."
mysql -u root -e "ALTER USER 'resortwala_staging'@'localhost' IDENTIFIED BY '${PASS}'; FLUSH PRIVILEGES;"

if [ $? -eq 0 ]; then
    echo "MySQL Password Set Successfully."
else
    echo "MySQL Password Set Failed."
fi

echo "Updating .env with QUOTES..."
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${QUOTED_PASS}/" "$ENV_FILE"

echo "Clearing Cache..."
cd /var/www/html/stagingapi.resortwala.com
php artisan config:clear
php artisan cache:clear

echo "Done."
