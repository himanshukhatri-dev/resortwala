#!/bin/bash
# ResortWala One-Step Rollback Script
# Usage: ./rollback_prod.sh <component>
# Example: ./rollback_prod.sh api

COMPONENT=$1
HTML_DIR="/var/www/html"

if [ -z "$COMPONENT" ]; then
    echo "Usage: $0 <customer|vendor|admin|api>"
    exit 1
fi

case $COMPONENT in
    customer) DEST="resortwala.com" ;;
    vendor)   DEST="vendor.resortwala.com" ;;
    admin)    DEST="admin.resortwala.com" ;;
    api)      DEST="api.resortwala.com" ;;
    *) echo "Invalid component"; exit 1 ;;
esac

DEST_PATH="$HTML_DIR/$DEST"
LATEST_BACKUP=$(ls -t ${DEST_PATH}_backup_*.tar.gz 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "No backup found for $COMPONENT"
    exit 1
fi

echo "Found latest backup: $LATEST_BACKUP"
read -p "Are you sure you want to rollback $COMPONENT to this backup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Rolling back $COMPONENT..."
    
    # Remove current files (except .env)
    find "$DEST_PATH" -mindepth 1 -not -name ".env" -delete
    
    # Extract backup
    tar -xzf "$LATEST_BACKUP" -C "$DEST_PATH"
    
    echo "Rollback successful for $COMPONENT"
    
    if [ "$COMPONENT" == "api" ]; then
        echo "Restarting PHP-FPM..."
        systemctl restart php8.2-fpm
    fi
else
    echo "Rollback cancelled."
fi
