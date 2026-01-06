#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/resortwala/db"
DB_USER="${DB_USERNAME:-root}" # Fallback or use env
DB_PASS="${DB_PASSWORD}"       # Ensure this is set in environment or loaded from .env
DB_NAME="resortwala_prod"
DATE=$(date +%Y-%m-%d_%H%M%S)
FILENAME="db_backup_${DATE}.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform Backup
echo "[$(date)] Starting Backup for $DB_NAME..."

# Check if env vars are set, otherwise try to load from api .env
if [ -z "$DB_PASS" ]; then
    if [ -f "/var/www/html/resortwala.com/api/.env" ]; then
        export $(grep -v '^#' /var/www/html/resortwala.com/api/.env | xargs)
        DB_USER=$DB_USERNAME
        DB_PASS=$DB_PASSWORD
        DB_NAME=$DB_DATABASE
    fi
fi

mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup Successful: $BACKUP_DIR/$FILENAME"
else
    echo "[$(date)] Backup Failed!"
    exit 1
fi

# Retention: Keep last 7 days, delete older
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete

echo "[$(date)] Cleanup Complete."
