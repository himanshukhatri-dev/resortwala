#!/bin/bash
# Final comprehensive fix
PASS="ResortWala_Staging_Update_2026!"
ENV_FILE="/var/www/html/stagingapi.resortwala.com/.env"

echo "=== Current .env DB settings ==="
grep "DB_" "$ENV_FILE"

echo ""
echo "=== Ensuring correct .env values ==="
sed -i 's/^DB_USERNAME=.*/DB_USERNAME=resortwala_staging/' "$ENV_FILE"
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD="ResortWala_Staging_Update_2026!"/' "$ENV_FILE"
sed -i 's/^DB_DATABASE=.*/DB_DATABASE=resortwala_staging/' "$ENV_FILE"

echo "=== Updated .env DB settings ==="
grep "DB_" "$ENV_FILE"

echo ""
echo "=== Testing DB connection directly ==="
mysql -u resortwala_staging -p"${PASS}" -e "USE resortwala_staging; SELECT COUNT(*) FROM property_masters;" 2>&1

echo ""
echo "=== Clearing all Laravel caches ==="
cd /var/www/html/stagingapi.resortwala.com
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo ""
echo "=== Done ==="
