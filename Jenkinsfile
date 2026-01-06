pipeline {
    agent any

    parameters {
        choice(name: 'DEPLOY_TARGET', choices: ['Auto', 'Beta', 'Production'], description: 'Select the target environment. "Auto" follows branch rules (master->Beta, release->Prod).')
    }

    environment {
        REMOTE_USER = 'root'
        REMOTE_HOST = '72.61.242.42'
        SSH_KEY = credentials('resortwala-deploy-key')
        
        // Directories
        BETA_DIR = '/var/www/html/beta.resortwala.com'
        PROD_WEB_DIR = '/var/www/html/resortwala.com'
        PROD_API_DIR = '/var/www/html/api.resortwala.com'
    }

    stages {
        stage('Build') {
            parallel {
                stage('Build Customer') {
                    steps {
                        dir('client-customer') {
                            sh 'npm install && npm run build'
                        }
                    }
                }
                stage('Build Vendor') {
                    steps {
                        dir('client-vendor') {
                            sh 'npm install && npm run build'
                        }
                    }
                }
                stage('Build Admin') {
                    steps {
                        dir('client-admin') {
                            sh 'npm install && npm run build'
                        }
                    }
                }
                stage('Build Backend') {
                    steps {
                        dir('api') {
                            sh 'composer install --no-dev --optimize-autoloader'
                        }
                    }
                }
            }
        }

        // --- STAGING DEPLOYMENT ---
        stage('Deploy to Staging') {
            when {
                expression { params.DEPLOY_TARGET == 'Beta' || (params.DEPLOY_TARGET == 'Auto' && env.BRANCH_NAME == 'master') }
            }
            steps {
                sshagent(['resortwala-deploy-key']) {
                    // Create dir if missing
                    sh "ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} 'mkdir -p ${BETA_DIR}'"
                    
                    // Deploy Frontend (Customer)
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-customer/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${BETA_DIR}/"
                    
                    // Note: Beta API deployment logic (if needed) goes here. 
                    // Currently assuming Beta frontend connects to existing stagingapi.
                }
            }
        }

        // --- PRODUCTION DEPLOYMENT ---
        stage('Production Gate') {
            when {
                anyOf {
                    branch 'release'
                    expression { params.DEPLOY_TARGET == 'Production' }
                }
            }
            steps {
                input message: 'Deploy to PRODUCTION?', ok: 'Deploy'
            }
        }

        stage('Deploy to Production') {
            when {
                anyOf {
                    branch 'release'
                    expression { params.DEPLOY_TARGET == 'Production' }
                }
            }
            steps {
                sshagent(['resortwala-deploy-key']) {
                    // 1. Deploy API
                    sh "rsync -avz --delete --exclude '.env' --exclude 'storage' -e 'ssh -o StrictHostKeyChecking=no' api/ ${REMOTE_USER}@${REMOTE_HOST}:${PROD_API_DIR}/"
                    
                    // 2. Deploy Frontends
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-customer/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${PROD_WEB_DIR}/"
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-vendor/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${PROD_WEB_DIR}/vendor/"
                    sh "rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' client-admin/dist/ ${REMOTE_USER}@${REMOTE_HOST}:${PROD_WEB_DIR}/admin/"

                    // 3. Post-Deploy Commands
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                            cd ${PROD_API_DIR} &&
                            php artisan migrate --force &&
                            php artisan config:cache &&
                            php artisan route:cache &&
                            php artisan view:clear
                        '
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'master') {
                        sh "curl -f -I https://beta.resortwala.com || echo 'Beta verification failed'"
                    }
                    if (env.BRANCH_NAME == 'release') {
                        sh "curl -f -I https://resortwala.com || echo 'Prod verification failed'"
                    }
                }
            }
        }
    }
}
