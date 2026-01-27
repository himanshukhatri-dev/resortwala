#!/bin/bash

# Jenkins Installation Script for Ubuntu
# Port: 9090

echo "Installing Java..."
apt-get update
# Ensure correct Java version for modern Jenkins (Java 17)
apt-get install -y fontconfig openjdk-17-jre software-properties-common

echo "Installing Jenkins..."
# Use the official Debian package repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

apt-get update
# Fail if installation fails
apt-get install -y jenkins || { echo "Jenkins Install Failed"; exit 1; }

echo "Configuring Jenkins Port to 9090..."
# Override systemd config for port
mkdir -p /etc/systemd/system/jenkins.service.d/
cat <<EOF > /etc/systemd/system/jenkins.service.d/override.conf
[Service]
Environment="JENKINS_PORT=9090"
EOF

systemctl daemon-reload
systemctl restart jenkins
systemctl enable jenkins

echo "Waiting for Jenkins to start..."
sleep 30

echo "----------------------------------------------------------------"
echo "Jenkins Installed Successfully!"
echo "URL: http://77.37.47.243:9090"
echo "----------------------------------------------------------------"
echo "Initial Admin Password:"
cat /var/lib/jenkins/secrets/initialAdminPassword
echo "----------------------------------------------------------------"
