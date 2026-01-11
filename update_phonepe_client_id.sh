#!/bin/bash

# Configuration
SERVER_USER="root"
SERVER_IP="72.61.242.42"
REMOTE_PATH="/var/www/html/stagingapi.resortwala.com"

# New Client ID
CLIENT_ID="SU2512151740277878517471"

echo "Updating .env on remote server ($SERVER_IP)..."

# SSH Command to append/update PHONEPE_CLIENT_ID
ssh $SERVER_USER@$SERVER_IP "
  cd $REMOTE_PATH || exit;
  
  # Check if .env exists
  if [ -f .env ]; then
      # Remove existing PHONEPE_CLIENT_ID if any
      sed -i '/^PHONEPE_CLIENT_ID=/d' .env
      
      # Append new PHONEPE_CLIENT_ID
      echo 'PHONEPE_CLIENT_ID=$CLIENT_ID' >> .env
      
      # Clear Config Cache
      php artisan config:clear
      
      echo 'SUCCESS: .env updated and config cleared.'
      grep 'PHONEPE_CLIENT_ID' .env
  else
      echo 'ERROR: .env file not found!'
  fi
"
