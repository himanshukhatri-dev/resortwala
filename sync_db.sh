#!/bin/bash
PROD_DB="resortwala_prod"
PROD_USER="resortwala_prod"
PROD_PASS="ResortWala@2025"

STAGE_DB="resortwala_staging"
STAGE_USER="resortwala_staging"
STAGE_PASS="Staging@2026_Secure!"

echo "Starting DB Sync..."

echo "1. Dumping Production DB ($PROD_DB)..."
mysqldump -u "$PROD_USER" -p"$PROD_PASS" "$PROD_DB" --no-tablespaces > prod_dump.sql

if [ $? -ne 0 ]; then
    echo "Error: Failed to dump production database."
    exit 1
fi

echo "2. Importing to Staging DB ($STAGE_DB)..."
mysql -u "$STAGE_USER" -p"$STAGE_PASS" "$STAGE_DB" < prod_dump.sql

if [ $? -ne 0 ]; then
    echo "Error: Failed to import to staging database."
    exit 1
fi

echo "3. Cleaning up..."
rm prod_dump.sql

echo "Database sync completed successfully."
