#!/bin/bash
DB_NAME="resortwala_staging"
DB_USER="resortwala_staging"
DB_PASS="Staging@2026_Secure!"
ENV_FILE="/var/www/html/stagingapi.resortwala.com/.env"

echo "Updating MySQL User..."
echo "Enter MySQL ROOT Password:"
read -s ROOT_PASS

mysql -u root -p"${ROOT_PASS}" <<MYSQL_SCRIPT
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo "Updating .env..."
sed -i "s/^DB_DATABASE=.*/DB_DATABASE=${DB_NAME}/" "$ENV_FILE"
sed -i "s/^DB_USERNAME=.*/DB_USERNAME=${DB_USER}/" "$ENV_FILE"
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${DB_PASS}/" "$ENV_FILE"
echo "Done."
