pipeline {
    agent any

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['Staging', 'Production'], description: 'Select the Environment to Deploy to')
        booleanParam(name: 'CONFIRM_PROD', defaultValue: false, description: 'Check this to confirm deployment if Production is selected')
    }

    environment {
        REMOTE_USER = 'root'
        REMOTE_HOST = '72.61.242.42'
        SSH_KEY = credentials('resortwala-deploy-key')
        
        // Dynamic vars placeholder - will be set in Initialize stage
        DEPLOY_DIR = '/var/www/html/beta.resortwala.com' 
    }

    stages {
        stage('Initialize') {
            steps {
                script {
                    if (params.DEPLOY_ENV == 'Production') {
                        env.DEPLOY_DIR = '/var/www/html/resortwala.com'
                        if (!params.CONFIRM_PROD) {
                            error("Production deployment selected but not confirmed! Please check CONFIRM_PROD.")
                        }
                    } else {
                        env.DEPLOY_DIR = '/var/www/html/beta.resortwala.com'
                    }
                    echo "Deploying to: ${params.DEPLOY_ENV} at ${env.DEPLOY_DIR}"
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('System Backup (Prod Only)') {
            when {
                expression { params.DEPLOY_ENV == 'Production' }
            }
            steps {
                sshagent(['resortwala-deploy-key']) {
                    script {
                        def backupScript = "${env.DEPLOY_DIR}/dev_tools/ops/backup_db.sh"
                        // Check if script exists before running (handles first deployment)
                        sh "ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} 'if [ -f ${backupScript} ]; then bash ${backupScript}; else echo \"Backup script not found, skipping...\"; fi'"
                    }
                }
            }
        }

        stage('Build & Prepare') {
            steps {
                // Frontends
                dir('client-customer') {
                    sh 'npm install && npm run build'
                }
                dir('client-vendor') {
                    sh 'npm install && npm run build'
                }
                dir('client-admin') {
                    sh 'npm install && npm run build'
                }
                
                // Backend
                dir('api') {
                    sh 'composer install --no-dev --optimize-autoloader'
                }
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['resortwala-deploy-key']) {
                     // Ensure Remote Dir Exists (Crucial for Staging/Beta first run)
                    sh "ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} 'mkdir -p ${env.DEPLOY_DIR}/api'"

                    // Deploy API
                    sh "rsync -avz --delete --exclude '.env' --exclude 'storage' -e 'ssh -o StrictHostKeyChecking=no' api/ ${REMOTE_USER}@${REMOTE_HOST}:${env.DEPLOY_DIR}/api/"
                    
                    // Deploy Frontends
                    // Customer App (Base: /) -> Root of domain
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-customer/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${env.DEPLOY_DIR}/"
                    
                    // Vendor App (Base: /vendor/)
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-vendor/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${env.DEPLOY_DIR}/vendor/"
                    
                    // Admin App (Base: /admin/)
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-admin/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${env.DEPLOY_DIR}/admin/"

                    // Permissions & Commands
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                            cd ${env.DEPLOY_DIR}/api &&
                            php artisan migrate --force &&
                            php artisan config:cache &&
                            php artisan route:cache

                        '
                    """
                }
            }
        }
        
        stage('Post-Deploy Check') {
            steps {
                script {
                    def checkUrl = (params.DEPLOY_ENV == 'Production') ? 'https://resortwala.com' : 'https://beta.resortwala.com'
                    sh "curl -f -I ${checkUrl} || echo 'Warning: Site check failed, but deployment completed.'"
                }
            }
        }
    }
}
