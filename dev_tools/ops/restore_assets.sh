#!/bin/bash

# Usage: ./restore_assets.sh <backup_file_path>

FILE=$1
DEST_DIR="/var/www/html/resortwala.com/api/storage/app/public"

if [ -z "$FILE" ]; then
    echo "Usage: $0 <path_to_tar_gz_file>"
    exit 1
fi

if [ ! -f "$FILE" ]; then
    echo "Error: File $FILE not found."
    exit 1
fi

echo "WARNING: This will overwrite files in '$DEST_DIR'."
read -p "Are you sure? (y/N): " confirm

if [[ $confirm != "y" ]]; then
    echo "Aborted."
    exit 0
fi

mkdir -p "$DEST_DIR"

echo "Restoring from $FILE..."

tar -xzf "$FILE" -C "$DEST_DIR"

if [ $? -eq 0 ]; then
    echo "Restore Complete."
    # Fix permissions
    chown -R www-data:www-data "$DEST_DIR"
    chmod -R 775 "$DEST_DIR"
else
    echo "Restore Failed."
    exit 1
fi
