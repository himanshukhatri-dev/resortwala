pipeline {
    agent any

    environment {
        // Configuration
        SERVER_IP = '72.61.242.42'
        SERVER_USER = 'root'
        DEPLOY_PATH = '/var/www/html'
        // Credentials ID from Jenkins
        SSH_CREDENTIALS_ID = 'hostinger-ssh-key' 
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'master', url: 'https://github.com/your-repo/resortwala.git'
            }
        }

        stage('Build Frontends') {
            steps {
                // Customer App
                dir('client-customer') {
                    sh 'npm install'
                    sh 'VITE_API_BASE_URL=http://stagingapi.resortwala.com npm run build'
                }
                
                // Vendor App
                dir('client-vendor') {
                    sh 'npm install'
                    sh 'VITE_API_BASE_URL=http://stagingapi.resortwala.com npm run build'
                }

                // Admin App
                dir('client-admin') {
                    sh 'npm install'
                    sh 'VITE_API_BASE_URL=http://stagingapi.resortwala.com npm run build'
                }
            }
        }

        stage('Prepare Backend') {
            steps {
                dir('api') {
                    sh 'composer install --no-dev --optimize-autoloader'
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                sshagent([SSH_CREDENTIALS_ID]) {
                    // Create directories
                    sh "ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'mkdir -p ${DEPLOY_PATH}/staging.resortwala.com ${DEPLOY_PATH}/stagingvendor.resortwala.com ${DEPLOY_PATH}/stagingadmin.resortwala.com ${DEPLOY_PATH}/stagingapi.resortwala.com'"

                    // Upload Builds (Rsync is faster, but scp is standard)
                    // Customer
                    sh "scp -r -o StrictHostKeyChecking=no client-customer/dist/* ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/staging.resortwala.com"
                    // Vendor
                    sh "scp -r -o StrictHostKeyChecking=no client-vendor/dist/* ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/stagingvendor.resortwala.com"
                    // Admin
                    sh "scp -r -o StrictHostKeyChecking=no client-admin/dist/* ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/stagingadmin.resortwala.com"
                    // API
                    sh "scp -r -o StrictHostKeyChecking=no api/* ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/stagingapi.resortwala.com"
                }
            }
        }

        stage('Configure Server') {
            steps {
                sshagent([SSH_CREDENTIALS_ID]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} '
                            cd ${DEPLOY_PATH}/stagingapi.resortwala.com
                            
                            # Ensure .env exists (Assume manually set first time, or copy example)
                            if [ ! -f .env ]; then
                                cp .env.example .env
                                # Set DB config via sed if needed, or rely on manual setup
                            fi
                            
                            # Laravel commands
                            php artisan migrate --force
                            php artisan config:cache
                            php artisan storage:link
                            
                            # Permissions
                            chown -R www-data:www-data ${DEPLOY_PATH}
                            find ${DEPLOY_PATH} -type d -exec chmod 755 {} \\;
                            find ${DEPLOY_PATH} -type f -exec chmod 644 {} \\;
                            chmod -R 775 storage bootstrap/cache
                        '
                    """
                }
            }
        }
    }
}
