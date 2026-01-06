#!/bin/bash

# Configuration
DB_NAME="resortwala_staging"
DB_USER="resortwala_staging"
DB_PASS="Staging@2026_Secure!"
ENV_FILE="/var/www/html/stagingapi.resortwala.com/.env"

echo "=== ResortWala Staging DB Fixer ==="
echo "This script will:"
echo "1. Reset the '${DB_USER}' password to '${DB_PASS}'"
echo "2. Grant necessary permissions."
echo "3. Update the .env file with these credentials."
echo "==================================="

# 1. Ask for Root Password or use sudo
echo "Please enter your MySQL ROOT password (hidden):"
read -s ROOT_PASS

# 2. Run SQL Commands
echo "Executing MySQL commands..."
mysql -u root -p"${ROOT_PASS}" <<EOF
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "[SUCCESS] MySQL User updated successfully."
else
    echo "[ERROR] MySQL command failed. Please check your root password."
    exit 1
fi

# 3. Update .env File
if [ -f "$ENV_FILE" ]; then
    echo "Updating .env file..."
    sed -i "s/^DB_DATABASE=.*/DB_DATABASE=${DB_NAME}/" "$ENV_FILE"
    sed -i "s/^DB_USERNAME=.*/DB_USERNAME=${DB_USER}/" "$ENV_FILE"
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${DB_PASS}/" "$ENV_FILE"
    echo "[SUCCESS] .env file updated."
else
    echo "[WARNING] .env file not found at $ENV_FILE. Skipping update."
fi

echo "==================================="
echo "DONE! Please test the API now."
