#!/bin/bash

# Configuration
BASE_DIR="/var/www/html/staging.resortwala.com"
CURRENT_DIR="/var/www/html/resortwala.com"

echo ">>> Setting up Atomic Deployment Structure at ${BASE_DIR}"

# 1. Create Base Directories
mkdir -p "${BASE_DIR}/releases"
mkdir -p "${BASE_DIR}/shared"
mkdir -p "${BASE_DIR}/shared/storage"
mkdir -p "${BASE_DIR}/shared/media"
mkdir -p "${BASE_DIR}/shared/config"

echo "Directory structure created."

# 2. Migrate Data (One-time setup - ONLY IF NOT EXISTS)
# We need to copy storage and media from the current live site to the shared folder.
# This assumes the current site is active at /var/www/html/resortwala.com

if [ -d "$CURRENT_DIR/api/storage" ]; then
    echo "Copying storage from ${CURRENT_DIR}..."
    cp -r ${CURRENT_DIR}/api/storage/* ${BASE_DIR}/shared/storage/
    chmod -R 775 ${BASE_DIR}/shared/storage
    chown -R www-data:www-data ${BASE_DIR}/shared/storage
else
    echo "WARNING: Original storage not found at ${CURRENT_DIR}/api/storage"
fi

# Media / Uploads (Usually in public/uploads or similar)
# Adjust path as per actual project structure. Assuming api/public/uploads or similar.
if [ -d "$CURRENT_DIR/api/public/uploads" ]; then
     echo "Copying media..."
     mkdir -p ${BASE_DIR}/shared/media/uploads
     cp -r ${CURRENT_DIR}/api/public/uploads/* ${BASE_DIR}/shared/media/uploads/
     chown -R www-data:www-data ${BASE_DIR}/shared/media
fi

# 3. Create a dummy release for initial switch
# To allow Nginx switch without full deploy, we can create a v0.0.0 linked to current
# But better to just wait for the first real deploy.

echo ">>> Setup Complete. Next steps:"
echo "1. Run your first deploy to populate releases/v1.0.0"
echo "2. Update Nginx root to ${BASE_DIR}/current/public (or appropriate index location)"
