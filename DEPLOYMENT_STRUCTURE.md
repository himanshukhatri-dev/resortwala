# ResortWala Deployment Structure

## Directory Structure

### Production (resortwala.com)
```
/var/www/html/resortwala.com/
├── index.html              # Customer App (React build)
├── assets/                 # Customer App assets
├── vendor/                 # Vendor App (React build)
│   ├── index.html
│   └── assets/
├── admin/                  # Admin App (React build)
│   ├── index.html
│   └── assets/
└── api/                    # Laravel API
    ├── app/
    ├── public/
    │   ├── index.php
    │   └── storage/       # Uploaded files
    ├── vendor/            # Composer dependencies
    └── .env              # Production credentials
```

### Beta/Staging (beta.resortwala.com)
```
/var/www/html/staging.resortwala.com/
├── index.html              # Customer App (React build)
├── assets/                 # Customer App assets
├── vendor/                 # Vendor App (React build)
│   ├── index.html
│   └── assets/
├── admin/                  # Admin App (React build)
│   ├── index.html
│   └── assets/
└── api/                    # Laravel API
    ├── app/
    ├── public/
    │   ├── index.php
    │   └── storage/       # Uploaded files
    ├── vendor/            # Composer dependencies
    └── .env              # Staging credentials
```

## Nginx Configuration

### Production (`nginx_production.conf`)
- Serves from: `/var/www/html/resortwala.com/`
- Domain: `resortwala.com`, `www.resortwala.com`
- API: `/var/www/html/resortwala.com/api/public`

### Beta (`nginx_beta.conf`)
- Serves from: `/var/www/html/staging.resortwala.com/`
- Domain: `beta.resortwala.com`
- API: `/var/www/html/staging.resortwala.com/api/public`

## Git Branch Strategy

- **`main` branch**   → Deploys to **Beta/Staging** (`staging.resortwala.com`)
- **`release` branch** → Deploys to **Production** (`resortwala.com`)

## Deployment Process

### Deploy to Beta (from main branch)

```bash
# 1. Build all apps locally
cd client-customer && npm run build
cd ../client-vendor && npm run build
cd ../client-admin && npm run build
cd ../api && composer install --no-dev

# 2. Deploy to server
./deploy_auto.ps1 -Environment beta -Branch main -Component all

# 3. On server, the files should be placed in:
# - Customer: /var/www/html/staging.resortwala.com/
# - Vendor: /var/www/html/staging.resortwala.com/vendor/
# - Admin: /var/www/html/staging.resortwala.com/admin/
# - API: /var/www/html/staging.resortwala.com/api/
```

### Deploy to Production (from release branch)

```bash
# 1. Merge main to release
git checkout release
git merge main
git push origin release

# 2. Build all apps locally
cd client-customer && npm run build
cd ../client-vendor && npm run build
cd ../client-admin && npm run build
cd ../api && composer install --no-dev

# 3. Deploy to server
./deploy_auto.ps1 -Environment production -Branch release -Component all

# 4. On server, the files should be placed in:
# - Customer: /var/www/html/resortwala.com/
# - Vendor: /var/www/html/resortwala.com/vendor/
# - Admin: /var/www/html/resortwala.com/admin/
# - API: /var/www/html/resortwala.com/api/
```

## Database Configuration

### Production API (.env)
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=resortwala_prod
DB_USERNAME=resortwala_prod
DB_PASSWORD=ResortWala@2025
```

### Staging API (.env)
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=resortwala_staging
DB_USERNAME=resortwala_staging
DB_PASSWORD=StagingPass2026
```

## Important Notes

1. **Both environments use the SAME directory structure** (all apps in one parent directory)
2. **Nginx configs are identical** except for domain names and paths
3. **API requires `composer install`** after deployment to create vendor folder
4. **Storage symlink** must be created: `php artisan storage:link`
5. **Permissions** must be set: `chown -R www-data:www-data storage/ bootstrap/cache/`

## Troubleshooting

### API returns 500 error
```bash
# Check Laravel logs
tail -50 /var/www/html/staging.resortwala.com/api/storage/logs/laravel.log

# Clear Laravel cache
cd /var/www/html/staging.resortwala.com/api
php artisan config:clear
php artisan cache:clear

# Restart PHP-FPM
systemctl restart php8.2-fpm
```

### Nginx configuration issues
```bash
# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx

# Check nginx error log
tail -50 /var/log/nginx/error.log
```
