pipeline {
    agent any

    parameters {
        choice(name: 'DEPLOY_TARGET', choices: ['Auto', 'Beta', 'Production'], description: 'Select the target environment. "Auto" follows branch rules (master->Beta, release->Prod).')
    }

    environment {
        REMOTE_USER = 'root'
        REMOTE_HOST = '77.37.47.243'
        SSH_KEY = credentials('resortwala-deploy-key')
        
        // Directories
        BETA_DIR = '/var/www/html/beta.resortwala.com'
        BETA_API_DIR = '/var/www/html/stagingapi.resortwala.com'
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

        // --- STAGING DEPLOYMENT (ATOMIC STRATEGY) ---
        stage('Deploy to Staging') {
            when {
                expression { params.DEPLOY_TARGET == 'Beta' || (params.DEPLOY_TARGET == 'Auto' && env.BRANCH_NAME == 'master') }
            }
            steps {
                sshagent(['resortwala-deploy-key']) {
                    script {
                        // 1. Prepare & Compress Frontends
                        sh "tar -czf customer.tar.gz -C client-customer/dist ."
                        sh "tar -czf vendor.tar.gz -C client-vendor/dist ."
                        sh "tar -czf admin.tar.gz -C client-admin/dist ."
                        sh "tar -czf api.tar.gz --exclude=.env --exclude=storage --exclude=.git -C api ."

                        // 2. Upload Archives
                        sh "scp -o StrictHostKeyChecking=no customer.tar.gz vendor.tar.gz admin.tar.gz api.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/"

                        // 3. ATOMIC DEPLOYMENT on Remote
                        sh """
                            ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                                # Config
                                TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
                                RELEASE_DIR="/var/www/html/releases/beta_\${TIMESTAMP}"
                                CURRENT_LINK="${BETA_DIR}"
                                STORAGE_DIR="/var/www/html/shared/beta_storage"  # Persistent Storage
                                
                                # Setup Directories
                                mkdir -p \${RELEASE_DIR}
                                mkdir -p /var/www/html/releases
                                mkdir -p \${STORAGE_DIR}
                                
                                echo "Deploying to: \${RELEASE_DIR}"

                                # Extract Frontends
                                mkdir -p \${RELEASE_DIR}/vendor \${RELEASE_DIR}/admin
                                tar -xzf /tmp/customer.tar.gz -C \${RELEASE_DIR}/
                                tar -xzf /tmp/vendor.tar.gz -C \${RELEASE_DIR}/vendor/
                                tar -xzf /tmp/admin.tar.gz -C \${RELEASE_DIR}/admin/

                                # Extract API (into api/ subdirectory or root? Previous was separate BETA_API_DIR)
                                # Assuming existing topology used separate domains, we keep it but verify atomicity for API too.
                                # IMPORTANT: The original config deployed API to `stagingapi.resortwala.com`.
                                # We need extended logic for API.
                                
                                # --- API DEPLOYMENT (Atomic Separate Dir) ---
                                API_RELEASE_DIR="/var/www/html/releases/beta_api_\${TIMESTAMP}"
                                API_CURRENT_LINK="${BETA_API_DIR}"
                                
                                mkdir -p \${API_RELEASE_DIR}
                                tar -xzf /tmp/api.tar.gz -C \${API_RELEASE_DIR}/
                                
                                # Symlink Storage (Persistence)
                                ln -sfn \${STORAGE_DIR} \${API_RELEASE_DIR}/storage
                                # Copy .env from shared or current (Assuming .env exists in shared)
                                if [ -f /var/www/html/shared/beta.env ]; then
                                    cp /var/www/html/shared/beta.env \${API_RELEASE_DIR}/.env
                                else
                                    # Fallback: Try to copy from previous deployment
                                    cp \${API_CURRENT_LINK}/.env \${API_RELEASE_DIR}/.env || true
                                fi

                                # Permissions & Commands (API)
                                cd \${API_RELEASE_DIR}
                                chown -R www-data:www-data .
                                chmod -R 775 storage bootstrap/cache
                                chmod -R 777 storage/logs # Ensure logs writeable
                                
                                export COMPOSER_ALLOW_SUPERUSER=1
                                composer install --no-dev --optimize-autoloader --no-interaction
                                php artisan migrate --force
                                php artisan config:cache
                                php artisan route:cache
                                php artisan view:clear

                                # --- ATOMIC SWITCH ---
                                # Frontend
                                ln -sfn \${RELEASE_DIR} \${CURRENT_LINK}
                                # API
                                ln -sfn \${API_RELEASE_DIR} \${API_CURRENT_LINK}
                                
                                echo "✅ Atomic Switch Complete."

                                # Cleanup (Keep last 5)
                                cd /var/www/html/releases
                                ls -dt beta_* | tail -n +6 | xargs rm -rf
                            '
                        """
                        // Cleanup Local
                        sh "rm *.tar.gz"
                    }
                }
            }
        }

        // --- PRODUCTION DEPLOYMENT (Using Tar/SCP Strategy) ---
        stage('Production Gate') {
            when {
                expression { params.DEPLOY_TARGET == 'Production' || (params.DEPLOY_TARGET == 'Auto' && env.BRANCH_NAME == 'release') }
            }
            steps {
                input message: 'Deploy to PRODUCTION?', ok: 'Deploy'
            }
        }

        // --- PRODUCTION DEPLOYMENT (Coming Soon Mode) ---
        stage('Deploy to Production') {
            when {
                anyOf {
                    branch 'release'
                    expression { params.DEPLOY_TARGET == 'Production' }
                }
            }
            steps {
                sshagent(['resortwala-deploy-key']) {
                     script {
                        // 1. Prepare & Compress
                        // API (Backend) - Always deploy for data consistency
                        sh "tar -czf api.tar.gz --exclude=.env --exclude=storage --exclude=.git -C api ."
                        
                        // Coming Soon Page (Static)
                        sh "tar -czf coming_soon.tar.gz -C coming_soon ."

                        // 2. Upload
                        sh "scp -o StrictHostKeyChecking=no api.tar.gz coming_soon.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:/tmp/"

                        // 3. Extract & Setup (Production)
                        // Deploying Coming Soon to PROD_WEB_DIR
                        sh """
                            ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                                # --- Deploy Coming Soon ---
                                mkdir -p ${PROD_WEB_DIR}
                                # Overwrite web dir with Coming Soon files
                                tar -xzf /tmp/coming_soon.tar.gz -C ${PROD_WEB_DIR}/
                                chmod -R 755 ${PROD_WEB_DIR}

                                # --- API Deployment (Background) ---
                                mkdir -p ${PROD_API_DIR}
                                tar -xzf /tmp/api.tar.gz -C ${PROD_API_DIR}/

                                # --- API Permissions & Setup ---
                                cd ${PROD_API_DIR}
                                chown -R www-data:www-data .
                                mkdir -p storage/logs storage/framework/views storage/framework/cache/data storage/framework/sessions bootstrap/cache
                                chown -R www-data:www-data storage bootstrap/cache public
                                chmod -R 775 storage bootstrap/cache
                                chmod -R 755 public
                                chmod -R 777 storage/logs
                                
                                # Commands
                                export COMPOSER_ALLOW_SUPERUSER=1
                                composer install --no-dev --optimize-autoloader --no-interaction
                                php artisan migrate --force
                                php artisan config:cache
                                php artisan route:cache
                                php artisan view:clear

                                # Cleanup
                                rm /tmp/customer.tar.gz /tmp/vendor.tar.gz /tmp/admin.tar.gz /tmp/api.tar.gz
                            '
                        """
                    }
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
