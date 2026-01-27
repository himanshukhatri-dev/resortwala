#!/bin/bash
PROD_USER="resortwala_prod"
PROD_PASS="ResortWala@2025"
STAGE_USER="resortwala_staging"
STAGE_PASS="Staging@2026_Secure!"

echo "Checking Production DB Access..."
mysql -u "$PROD_USER" -p"$PROD_PASS" -e "EXIT" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "SUCCESS: Production Access OK"
else
    echo "FAILURE: Production Access DENIED"
fi

echo "Checking Staging DB Access..."
mysql -u "$STAGE_USER" -p"$STAGE_PASS" -e "EXIT" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "SUCCESS: Staging Access OK"
else
    echo "FAILURE: Staging Access DENIED"
fi

echo "Checking Staging .env content..."
cat /var/www/html/stagingapi.resortwala.com/.env | grep DB_

echo "Checking Production .env content (if available)..."
cat /var/www/html/api.resortwala.com/.env 2>/dev/null | grep DB_ || echo "Prod .env not found at expected path"
