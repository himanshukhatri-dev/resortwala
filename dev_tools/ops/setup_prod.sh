#!/bin/bash

# Production Setup Script
# Usage: ./setup_prod.sh

BASE_DIR="/var/www/html/resortwala.com"

echo "Setting up Production Environment at $BASE_DIR..."

# 1. Create Directories
mkdir -p "$BASE_DIR/api"
mkdir -p "$BASE_DIR/client-customer"
mkdir -p "$BASE_DIR/client-vendor"
mkdir -p "$BASE_DIR/client-admin"

# 2. Setup API Storage & Cache
cd "$BASE_DIR/api" || exit
mkdir -p storage/logs storage/framework/views storage/framework/cache/data storage/framework/sessions bootstrap/cache

# 3. Permissions
echo "Setting Permissions..."
chown -R www-data:www-data "$BASE_DIR"
find "$BASE_DIR" -type f -exec chmod 644 {} \;
find "$BASE_DIR" -type d -exec chmod 755 {} \;

# Specific Write Permissions for Laravel
chmod -R 775 storage bootstrap/cache
chmod -R 775 storage/logs

echo "Setup Complete. Ensure .env is placed in $BASE_DIR/api/.env and populated."
