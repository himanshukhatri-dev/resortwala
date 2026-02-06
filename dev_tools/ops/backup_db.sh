#!/bin/bash

# Usage: ./backup_db.sh [TAG]
# Example: ./backup_db.sh v1.0.0 -> db_backup_v1.0.0_2023...sql.gz

# Configuration
BACKUP_DIR="/var/backups/resortwala/db"
TAG=$1
DATE=$(date +%Y-%m-%d_%H%M%S)

if [ -n "$TAG" ]; then
    FILENAME="db_backup_${TAG}_${DATE}.sql.gz"
else
    FILENAME="db_backup_${DATE}.sql.gz"
fi

# Locate .env file
# Priority: 1. Shared (New) 2. Current Symlink (New) 3. Old Static Path
if [ -f "/var/www/html/resortwala_v2/shared/.env" ]; then
    ENV_FILE="/var/www/html/resortwala_v2/shared/.env"
elif [ -f "/var/www/html/resortwala_v2/current/.env" ]; then
    ENV_FILE="/var/www/html/resortwala_v2/current/.env"
elif [ -f "/var/www/html/api.resortwala.com/.env" ]; then
    ENV_FILE="/var/www/html/api.resortwala.com/.env"
elif [ -f "/var/www/html/resortwala.com/api/.env" ]; then
    ENV_FILE="/var/www/html/resortwala.com/api/.env"
else
    echo "ERROR: Could not find .env file!"
    exit 1
fi

echo "Using .env from: $ENV_FILE"

# Load credentials
export $(grep -v '^#' "$ENV_FILE" | grep 'DB_' | xargs)

DB_USER="${DB_USERNAME:-root}"
DB_PASS="${DB_PASSWORD}"
DB_NAME="${DB_DATABASE:-resortwala_prod}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform Backup
echo "[$(date)] Starting Backup for $DB_NAME..."

mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup Successful: $BACKUP_DIR/$FILENAME"
else
    echo "[$(date)] Backup Failed!"
    exit 1
fi

# Retention: Keep last 30 days
echo "Pruning backups older than 30 days..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete

echo "[$(date)] Cleanup Complete."

