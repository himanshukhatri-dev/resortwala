#!/bin/bash

# ResortWala Unified Local Start Script for Git Bash

echo "========================================="
echo "Starting ResortWala Unified Environment"
echo "========================================="
echo ""

# 1. Start SSH Tunnel for Staging Database
if ! pgrep -x "ssh" > /dev/null
then
    echo "Opening SSH Tunnel to Staging Database (Port 3307)..."
    ssh -N -L 3307:127.0.0.1:3306 root@77.37.47.243 &
    sleep 5
else
    echo "SSH Tunnel appears to be running."
fi

# 2. Sync Local Environment Files
echo "Syncing environment files..."
[ -f "api/.env.local" ] && cp api/.env.local api/.env
[ -f "client-customer/.env.local" ] && cp client-customer/.env.local client-customer/.env
[ -f "client-vendor/.env.local" ] && cp client-vendor/.env.local client-vendor/.env
[ -f "client-admin/.env.local" ] && cp client-admin/.env.local client-admin/.env

# 3. Start Docker Containers (Unified)
echo "Starting Docker Containers (Gateway + API + Frontends)..."
docker-compose --env-file .env.unified -f docker-compose.unified.yml up -d --remove-orphans

echo ""
echo "========================================="
echo "Local Environment is Running!"
echo "Gateway:  http://local.resortwala.com"
echo "API:      http://local.resortwala.com/api"
echo "Customer: http://local.resortwala.com"
echo "Vendor:   http://local.resortwala.com/vendor"
echo "Admin:    http://local.resortwala.com/admin"
echo "========================================="
echo "Logs: docker-compose -f docker-compose.unified.yml logs -f"
echo "Stop: docker-compose -f docker-compose.unified.yml down"
echo ""
echo "Checking container status..."
docker-compose --env-file .env.unified -f docker-compose.unified.yml ps
