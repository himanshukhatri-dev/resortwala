# Environment Configuration Guide

## Overview

ResortWala uses `.env` files to manage environment-specific configurations (database credentials, API keys, etc.). Each environment (local, beta, production) has its own `.env` file on the server.

## Environment File Locations

### Local Development
```
/path/to/resortwala/api/.env
```
- Used when running `php artisan serve` locally
- Contains local database credentials (localhost, root, etc.)

### Beta/Staging Server
```
/var/www/html/stagingapi.resortwala.com/.env
```
- Used by beta.resortwala.com
- Contains staging database credentials

### Production Server
```
/var/www/html/api.resortwala.com/.env
```
- Used by resortwala.com
- Contains production database credentials

## Current Environment Configurations

### Beta/Staging (.env)
```env
APP_NAME=ResortWala
APP_ENV=local
APP_DEBUG=true
APP_URL=https://beta.resortwala.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=resortwala_staging
DB_USERNAME=resortwala_staging
DB_PASSWORD=StagingPass2026
```

### Production (.env)
```env
APP_NAME=ResortWala
APP_ENV=production
APP_DEBUG=false
APP_URL=https://resortwala.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=resortwala_prod
DB_USERNAME=resortwala_prod
DB_PASSWORD=ResortWala@2025
```

## How .env Files Are Managed

### 1. **NOT Committed to Git**
`.env` files are listed in `.gitignore` and are **never** committed to the repository for security reasons.

### 2. **Template Files in Repository**
You have template files that ARE committed:
- `api/.env.example` - Template with placeholder values
- `api/.env.prod_final` - Production credentials (stored locally, not deployed)
- `production.env` - Another production template

### 3. **Deployment Process**

#### Current Manual Process:
1. Build your application locally
2. Deploy files to server (excluding `.env`)
3. `.env` file already exists on server (created once, never overwritten)
4. Laravel reads the server's `.env` file

#### Recommended Automated Process:
```bash
# In your deploy.ps1 script:

# For Beta deployment:
# 1. Build and upload code
# 2. SSH into server
# 3. Ensure .env exists (copy from template if first time)
ssh root@77.37.47.243 "
  if [ ! -f /var/www/html/stagingapi.resortwala.com/.env ]; then
    cp /var/www/html/stagingapi.resortwala.com/.env.example /var/www/html/stagingapi.resortwala.com/.env
    # Then manually edit with correct credentials
  fi
"

# For Production deployment:
ssh root@77.37.47.243 "
  if [ ! -f /var/www/html/api.resortwala.com/.env ]; then
    cp /var/www/html/api.resortwala.com/.env.example /var/www/html/api.resortwala.com/.env
    # Then manually edit with correct credentials
  fi
"
```

## Best Practices

### 1. **Initial Setup (One-time)**
When setting up a new environment for the first time:

```bash
# SSH into server
ssh root@77.37.47.243

# For Beta:
cd /var/www/html/stagingapi.resortwala.com
cp .env.example .env
nano .env  # Edit with correct credentials
php artisan key:generate
php artisan config:clear

# For Production:
cd /var/www/html/api.resortwala.com
cp .env.example .env
nano .env  # Edit with correct credentials
php artisan key:generate
php artisan config:clear
```

### 2. **Updating Environment Variables**
If you need to change a variable (e.g., database password):

```bash
# SSH into server
ssh root@77.37.47.243

# Edit the .env file
nano /var/www/html/stagingapi.resortwala.com/.env

# Clear Laravel's config cache
cd /var/www/html/stagingapi.resortwala.com
php artisan config:clear
php artisan cache:clear

# Restart PHP-FPM to clear opcache
systemctl restart php8.2-fpm
```

### 3. **Security Rules**
- ✅ **DO**: Keep `.env` files only on the server
- ✅ **DO**: Use strong, unique passwords for each environment
- ✅ **DO**: Set `APP_DEBUG=false` in production
- ❌ **DON'T**: Commit `.env` files to Git
- ❌ **DON'T**: Share `.env` files via email/chat
- ❌ **DON'T**: Use the same passwords across environments

## Environment-Specific Settings

### Local Development
```env
APP_ENV=local
APP_DEBUG=true
DB_HOST=localhost
DB_DATABASE=resortwala_local
DB_USERNAME=root
DB_PASSWORD=root
```

### Beta/Staging
```env
APP_ENV=local  # or staging
APP_DEBUG=true  # Can be true for debugging
DB_HOST=localhost
DB_DATABASE=resortwala_staging
DB_USERNAME=resortwala_staging
DB_PASSWORD=StagingPass2026
```

### Production
```env
APP_ENV=production
APP_DEBUG=false  # MUST be false
DB_HOST=localhost
DB_DATABASE=resortwala_prod
DB_USERNAME=resortwala_prod
DB_PASSWORD=ResortWala@2025
```

## Troubleshooting

### Issue: Changes to .env not taking effect
**Solution:**
```bash
cd /var/www/html/stagingapi.resortwala.com  # or api.resortwala.com for prod
php artisan config:clear
php artisan cache:clear
systemctl restart php8.2-fpm
```

### Issue: Database connection errors
**Solution:**
1. Verify `.env` credentials match MySQL user:
```bash
# Test database connection
mysql -u resortwala_staging -p'StagingPass2026' -e "USE resortwala_staging; SELECT 1;"
```

2. Check if password has special characters that need escaping:
```env
# DON'T use quotes for simple passwords
DB_PASSWORD=StagingPass2026

# Use quotes ONLY if password has spaces or special shell characters
DB_PASSWORD="Complex@Pass#2026"
```

### Issue: APP_KEY missing
**Solution:**
```bash
cd /var/www/html/stagingapi.resortwala.com
php artisan key:generate
```

## Deployment Checklist

When deploying to a new environment:

- [ ] Copy `.env.example` to `.env`
- [ ] Update `APP_NAME`, `APP_ENV`, `APP_URL`
- [ ] Set `APP_DEBUG` (true for staging, false for production)
- [ ] Generate `APP_KEY` with `php artisan key:generate`
- [ ] Configure database credentials (`DB_*`)
- [ ] Set up mail settings (`MAIL_*`)
- [ ] Configure payment gateway keys
- [ ] Set up SMS API credentials
- [ ] Clear all caches: `php artisan config:clear && php artisan cache:clear`
- [ ] Test the application

## Summary

**Key Points:**
1. `.env` files live ONLY on the server, never in Git
2. Each environment has its own `.env` file with unique credentials
3. After changing `.env`, always clear Laravel cache
4. Use `APP_DEBUG=false` in production for security
5. Keep passwords secure and different for each environment
