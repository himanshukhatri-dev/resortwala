#!/bin/bash

# Usage: ./restore_db.sh <backup_file_path>

FILE=$1

if [ -z "$FILE" ]; then
    echo "Usage: $0 <path_to_sql_gz_file>"
    exit 1
fi

if [ ! -f "$FILE" ]; then
    echo "Error: File $FILE not found."
    exit 1
fi

# Load Credentials
if [ -f "/var/www/html/resortwala.com/api/.env" ]; then
    export $(grep -v '^#' /var/www/html/resortwala.com/api/.env | xargs)
else
    echo "Error: Cannot find .env file to load database credentials."
    exit 1
fi

echo "WARNING: This will overwrite database '$DB_DATABASE'."
read -p "Are you sure? (y/N): " confirm

if [[ $confirm != "y" ]]; then
    echo "Aborted."
    exit 0
fi

echo "Restoring from $FILE..."

gunzip < "$FILE" | mysql -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE"

if [ $? -eq 0 ]; then
    echo "Restore Complete."
else
    echo "Restore Failed."
    exit 1
fi
