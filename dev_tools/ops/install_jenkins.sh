#!/bin/bash

# Jenkins Installation Script for Ubuntu
# Port: 9090

echo "Installing Java..."
apt-get update
apt-get install -y fontconfig openjdk-17-jre

echo "Installing Jenkins..."
wget -O /usr/share/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | tee /etc/apt/sources.list.d/jenkins.list > /dev/null
apt-get update
apt-get install -y jenkins

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
echo "URL: http://72.61.242.42:9090"
echo "----------------------------------------------------------------"
echo "Initial Admin Password:"
cat /var/lib/jenkins/secrets/initialAdminPassword
echo "----------------------------------------------------------------"
