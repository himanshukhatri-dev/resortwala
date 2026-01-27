#!/bin/bash
# Quick setup script for Git SSH access on the server
# Run this on the server: ssh root@77.37.47.243 'bash -s' < setup_git_ssh.sh

set -e

echo "========================================="
echo "Setting up Git SSH access for deployment"
echo "========================================="
echo ""

# Generate SSH key if it doesn't exist
if [ ! -f ~/.ssh/resortwala_deploy ]; then
    echo "[1/4] Generating SSH deploy key..."
    ssh-keygen -t ed25519 -C "deploy@resortwala" -f ~/.ssh/resortwala_deploy -N ""
    echo "✓ SSH key generated"
else
    echo "[1/4] SSH key already exists"
fi

echo ""
echo "[2/4] Adding GitHub to known hosts..."
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null
echo "✓ GitHub added to known hosts"

echo ""
echo "[3/4] Configuring SSH..."
# Create SSH config if it doesn't exist
if ! grep -q "Host github.com" ~/.ssh/config 2>/dev/null; then
    cat >> ~/.ssh/config << 'EOF'

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/resortwala_deploy
    StrictHostKeyChecking no
EOF
    echo "✓ SSH config created"
else
    echo "✓ SSH config already exists"
fi

# Set proper permissions
chmod 600 ~/.ssh/config 2>/dev/null || true
chmod 600 ~/.ssh/resortwala_deploy 2>/dev/null || true
chmod 644 ~/.ssh/resortwala_deploy.pub 2>/dev/null || true

echo ""
echo "[4/4] Testing GitHub connection..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✓ GitHub connection successful!"
else
    echo "⚠ GitHub connection test inconclusive (this is normal if deploy key not added yet)"
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Copy this public key and add it to GitHub:"
echo ""
cat ~/.ssh/resortwala_deploy.pub
echo ""
echo "2. Go to: https://github.com/himanshukhatri-dev/resortwala/settings/keys"
echo "3. Click 'Add deploy key'"
echo "4. Paste the key above"
echo "5. Title: 'ResortWala Server Deploy Key'"
echo "6. Click 'Add key'"
echo ""
echo "7. Test deployment: ./deploy_auto.ps1"
echo ""
