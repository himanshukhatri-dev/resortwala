#!/bin/bash

# Configuration
PROD_DB="resortwala_prod"
PROD_USER="root"
# PROD_PASS="" # Using socket auth for root

STAGING_DB="resortwala_staging"
STAGING_USER="root"
# STAGING_PASS="" # Using socket auth for root

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/html/backups/db_sync"

echo "==============================================="
echo "  ResortWala DB Replication: PROD -> STAGING   "
echo "==============================================="
echo "Started at: $DATE"

# 1. Ensure Backup Directory Exists
mkdir -p $BACKUP_DIR

# 2. Backup Staging (Safety First)
echo "[1/4] Backing up current Staging DB..."
mysqldump -u"$STAGING_USER" "$STAGING_DB" > "$BACKUP_DIR/staging_backup_$DATE.sql"
if [ $? -eq 0 ]; then
    echo "      Success: $BACKUP_DIR/staging_backup_$DATE.sql"
else
    echo "      FAILED to backup staging! Aborting."
    exit 1
fi

# 3. Dump Production DB (Schema + Data)
echo "[2/4] Dumping Production DB..."
# Exclude sensitive tables if needed, for now full dump
mysqldump -u"$PROD_USER" "$PROD_DB" --single-transaction --quick --lock-tables=false > "$BACKUP_DIR/prod_dump_$DATE.sql"
if [ $? -eq 0 ]; then
    echo "      Success: Dump created."
else
    echo "      FAILED to dump production! Aborting."
    exit 1
fi

# 4. Import to Staging
echo "[3/4] Importing to Staging DB..."
mysql -u"$STAGING_USER" "$STAGING_DB" < "$BACKUP_DIR/prod_dump_$DATE.sql"
if [ $? -eq 0 ]; then
    echo "      Success: Data imported."
else
    echo "      FAILED to import to staging! Check credentials or disk space."
    exit 1
fi

# 5. Run Migrations (To ensure Staging is up to date with any dev changes not in Prod yet)
echo "[4/4] Running Pending Migrations on Staging..."
cd /var/www/html/stagingapi.resortwala.com
php artisan migrate --force

echo "==============================================="
echo "  Replication COMPLETED Successfully!          "
echo "==============================================="
