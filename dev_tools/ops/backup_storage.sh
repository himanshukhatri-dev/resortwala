#!/bin/bash

# Configuration
SOURCE_DIR="/var/www/html/api.resortwala.com/storage/app/public"
BACKUP_DIR="/var/backups/resortwala/storage"
DATE=$(date +%Y-%m-%d)
FILENAME="storage_backup_${DATE}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Backing up storage..."

tar -czf "$BACKUP_DIR/$FILENAME" -C "$SOURCE_DIR" .

if [ $? -eq 0 ]; then
    echo "[$(date)] Storage Backup Successful: $BACKUP_DIR/$FILENAME"
else
    echo "[$(date)] Storage Backup Failed!"
    exit 1
fi

# Retention: Keep last 30 days
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +30 -delete
