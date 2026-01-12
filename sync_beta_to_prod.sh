#!/bin/bash

# Configuration (Using Root Socket Auth)
SOURCE_DB_NAME='resortwala_staging'
TARGET_DB_NAME='resortwala_prod'

SOURCE_FILES="/var/www/html/stagingapi.resortwala.com/public/storage/"
TARGET_FILES="/var/www/html/api.resortwala.com/public/storage/"

echo "--- STARTING DATA SYNC (ROOT MODE) ---"

# 1. Database Sync
echo "[1/3] Dumping Beta Database ($SOURCE_DB_NAME)..."
# Use root without password (socket auth)
mysqldump -u root "$SOURCE_DB_NAME" --single-transaction --quick --lock-tables=false > /tmp/beta_dump.sql

if [ $? -eq 0 ]; then
    echo "[2/3] Importing to Production Database ($TARGET_DB_NAME)..."
    # Use root without password
    mysql -u root "$TARGET_DB_NAME" < /tmp/beta_dump.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Database Sync Successful."
    else
        echo "❌ Database Import Failed."
        rm /tmp/beta_dump.sql
        exit 1
    fi
else
    echo "❌ Database Dump Failed."
    exit 1
fi

# Clean up dump
rm /tmp/beta_dump.sql

# 2. File Sync
echo "[3/3] Syncing Storage Files..."
# Ensure target directory exists
mkdir -p "$TARGET_FILES"

# Sync files (Recursive, Archive, Update only)
rsync -auv "$SOURCE_FILES" "$TARGET_FILES"

echo "✅ File Sync Complete."

# 3. Cache Clear
echo "Cleaning up..."
cd /var/www/html/api.resortwala.com
php artisan storage:link
php artisan optimize:clear

echo "--- SYNC COMPLETED SUCCESSFULLY ---"
