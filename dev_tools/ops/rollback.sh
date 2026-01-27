#!/bin/bash

# Usage: ./rollback.sh [VERSION]
# Example: ./rollback.sh v1.1.0

BASE_DIR="/var/www/html/resortwala_v2"
RELEASES_DIR="${BASE_DIR}/releases"
CURRENT_LINK="${BASE_DIR}/current"

TARGET_VERSION=$1

if [ -z "$TARGET_VERSION" ]; then
    echo "ERROR: You must specify a version to rollback to."
    echo "Available versions:"
    ls -1 "$RELEASES_DIR"
    exit 1
fi

TARGET_DIR="${RELEASES_DIR}/${TARGET_VERSION}"

if [ ! -d "$TARGET_DIR" ]; then
    echo "ERROR: Release directory does not exist: $TARGET_DIR"
    exit 1
fi

echo ">>> Rolling back to version: $TARGET_VERSION"

# Atomic Switch
ln -sfn "$TARGET_DIR" "$CURRENT_LINK"

echo "Symlink updated. Reloading Nginx/PHP..."
# Reload services (Adjust service names as needed, e.g., php8.1-fpm)
sudo service nginx reload
sudo service php8.2-fpm reload  # Assuming PHP 8.2, adjust if needed

echo ">>> Rollback Complete. Current version is now checking..."
ls -l "$CURRENT_LINK"
