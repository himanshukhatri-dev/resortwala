#!/bin/bash
# Deploy Nginx Configuration Script
# Usage: ./deploy_nginx.sh [beta|production]

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./deploy_nginx.sh [beta|production]"
    exit 1
fi

SERVER_IP="77.37.47.243"
SERVER_USER="root"

if [ "$ENVIRONMENT" == "beta" ]; then
    echo "Deploying BETA (Staging) Nginx Configuration..."
    CONFIG_FILE="nginx_beta.conf"
    REMOTE_FILE="/etc/nginx/sites-available/beta_atomic"
    SYMLINK_NAME="beta_atomic"
elif [ "$ENVIRONMENT" == "production" ]; then
    echo "Deploying PRODUCTION Nginx Configuration..."
    CONFIG_FILE="nginx_production.conf"
    REMOTE_FILE="/etc/nginx/sites-available/resortwala"
    SYMLINK_NAME="resortwala"
else
    echo "Error: Environment must be 'beta' or 'production'"
    exit 1
fi

# Check if config file exists locally
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: $CONFIG_FILE not found!"
    exit 1
fi

echo "1. Backing up current config on server..."
ssh $SERVER_USER@$SERVER_IP "cp $REMOTE_FILE ${REMOTE_FILE}.backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

echo "2. Uploading new config..."
scp $CONFIG_FILE $SERVER_USER@$SERVER_IP:$REMOTE_FILE

echo "3. Creating symlink if not exists..."
ssh $SERVER_USER@$SERVER_IP "ln -sf $REMOTE_FILE /etc/nginx/sites-enabled/$SYMLINK_NAME"

echo "4. Testing nginx configuration..."
ssh $SERVER_USER@$SERVER_IP "nginx -t"

echo "5. Reloading nginx..."
ssh $SERVER_USER@$SERVER_IP "systemctl reload nginx"

echo "✅ Nginx configuration deployed successfully for $ENVIRONMENT!"

if [ "$ENVIRONMENT" == "beta" ]; then
    echo "Test: curl -k https://beta.resortwala.com/api/properties"
else
    echo "Test: curl -k https://resortwala.com/api/properties"
fi
