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
        
        // Default Staging Paths (Matches Nginx Config)
        CUSTOMER_DIR = '/var/www/html/staging.resortwala.com'
        ADMIN_DIR    = '/var/www/html/stagingadmin.resortwala.com'
        VENDOR_DIR   = '/var/www/html/stagingvendor.resortwala.com'
        API_DIR      = '/var/www/html/stagingapi.resortwala.com'
    }

    stages {
        stage('Initialize') {
            steps {
                script {
                    if (params.DEPLOY_ENV == 'Production') {
                        // Production Paths (To be finalized, assuming standard structure for now or user request)
                        // For now we error if not explicitly set up, OR we map to expected prod paths
                        env.CUSTOMER_DIR = '/var/www/html/resortwala.com'
                        env.ADMIN_DIR    = '/var/www/html/admin.resortwala.com'
                        env.VENDOR_DIR   = '/var/www/html/vendor.resortwala.com'
                        env.API_DIR      = '/var/www/html/api.resortwala.com'

                        if (!params.CONFIRM_PROD) {
                            error("Production deployment selected but not confirmed! Please check CONFIRM_PROD.")
                        }
                    } 
                    
                    echo "Deploying to ${params.DEPLOY_ENV}"
                    echo "Customer: ${env.CUSTOMER_DIR}"
                    echo "Admin:    ${env.ADMIN_DIR}"
                    echo "Vendor:   ${env.VENDOR_DIR}"
                    echo "API:      ${env.API_DIR}"
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
                        // Assuming backup script is in API dir or central tools dir
                        def backupScript = "${env.API_DIR}/../dev_tools/ops/backup_db.sh" 
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
                     // Ensure Remote Dirs Exist
                    sh "ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} 'mkdir -p ${env.CUSTOMER_DIR} ${env.ADMIN_DIR} ${env.VENDOR_DIR} ${env.API_DIR}'"

                    // Deploy API
                    // Note: Exclude .env and storage to prevent overwriting config/data
                    sh "rsync -avz --delete --exclude '.env' --exclude 'storage' -e 'ssh -o StrictHostKeyChecking=no' api/ ${REMOTE_USER}@${REMOTE_HOST}:${env.API_DIR}/"
                    
                    // Deploy Frontends
                    // Customer App -> CUSTOMER_DIR
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-customer/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${env.CUSTOMER_DIR}/"
                    
                    // Vendor App -> VENDOR_DIR
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-vendor/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${env.VENDOR_DIR}/"
                    
                    // Admin App -> ADMIN_DIR
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-admin/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${env.ADMIN_DIR}/"

                    // Permissions & Commands (API)
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                            cd ${env.API_DIR} &&
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
