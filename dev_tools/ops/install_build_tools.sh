#!/bin/bash

# Install Build Tools for Jenkins (Node, PHP, Composer)
# Run as root

echo "Updating apt..."
apt-get update

echo "Installing Git, Unzip, Curl..."
apt-get install -y git unzip curl

echo "Installing Node.js (LTS)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "Installing PHP and extensions..."
# Ubuntu 24.04 defaults to PHP 8.3
apt-get install -y php-cli php-common php-mysql php-zip php-gd php-mbstring php-curl php-xml php-bcmath

echo "Installing Composer..."
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

echo "Verifying versions..."
node -v
npm -v
php -v
composer -v

echo "Configuring Jenkins SSH Trust..."
# Jenkins needs to SSH into '72.61.242.42' (localhost external IP) to deploy
mkdir -p /var/lib/jenkins/.ssh
ssh-keyscan 72.61.242.42 >> /var/lib/jenkins/.ssh/known_hosts
chown -R jenkins:jenkins /var/lib/jenkins/.ssh
chmod 600 /var/lib/jenkins/.ssh/known_hosts

echo "Build Tools Installed Successfully!"
