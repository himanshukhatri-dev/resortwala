#!/bin/bash
# Script to upgrade Node.js to v22 (LTS) on the server
# Run as root: ssh root@77.37.47.243 'bash -s' < upgrade_node.sh

set -e

echo "========================================="
echo "Upgrading Node.js to v22 (LTS)"
echo "========================================="

# 1. Install NVM if not present
if [ ! -d "$HOME/.nvm" ]; then
    echo "[1/3] Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    echo "[1/3] NVM already installed"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# 2. Install Node 22
echo "[2/3] Installing Node.js v22..."
nvm install 22
nvm use 22
nvm alias default 22

# 3. Verify
echo "[3/3] Verifying installation..."
NODE_VER=$(node -v)
NPM_VER=$(npm -v)

echo "✓ Node.js updated to: $NODE_VER"
echo "✓ npm updated to: $NPM_VER"

echo "========================================="
echo "Node.js upgrade complete!"
echo "========================================="
