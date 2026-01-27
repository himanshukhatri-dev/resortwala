# Automated Deployment Guide

## Overview

ResortWala uses Git-based deployments where the server pulls code from the repository instead of uploading from your local machine. This ensures consistency and allows for easy rollbacks.

## Deployment Strategy

- **`master` branch** → Deploys to **Beta/Staging** (`beta.resortwala.com`)
- **`release` branch** → Deploys to **Production** (`resortwala.com`)

## Prerequisites

1. **Git Repository**: Code must be pushed to your Git repository
2. **SSH Access**: SSH key-based authentication to server (`root@77.37.47.243`)
3. **Server Requirements**: Node.js, PHP, Composer, Git installed on server

## Quick Start

### Deploy to Beta (Staging)

```powershell
# 1. Commit and push your changes to master branch
git add .
git commit -m "Your changes"
git push origin master

# 2. Run deployment script
.\deploy_auto.ps1 -Environment beta -Branch master
```

### Deploy to Production

```powershell
# 1. Merge master to release branch
git checkout release
git merge master
git push origin release

# 2. Run deployment script
.\deploy_auto.ps1 -Environment production -Branch release
```

## Deployment Scripts

### 1. `deploy_auto.ps1` (Local Trigger)

Run this from your local machine. It uploads the deployment script to the server and executes it.

**Usage:**
```powershell
.\deploy_auto.ps1 -Environment <beta|production> -Branch <master|release>
```

**Examples:**
```powershell
# Deploy master to beta
.\deploy_auto.ps1 -Environment beta -Branch master

# Deploy release to production
.\deploy_auto.ps1 -Environment production -Branch release
```

### 2. `deploy_from_git.sh` (Server-Side Script)

This script runs on the server and:
1. Clones the specified branch from Git
2. Builds frontend apps (React)
3. Deploys API (Laravel)
4. Sets proper permissions
5. Clears caches
6. Restarts PHP-FPM

**Direct Usage on Server:**
```bash
ssh root@77.37.47.243
/tmp/deploy_from_git.sh beta master
```

## What Gets Deployed

### Beta Environment

| Component | Source | Destination |
|-----------|--------|-------------|
| Customer App | `client-customer/` | `/var/www/html/staging.resortwala.com/` |
| Vendor App | `client-vendor/` | `/var/www/html/stagingvendor.resortwala.com/` |
| Admin App | `client-admin/` | `/var/www/html/stagingadmin.resortwala.com/` |
| API | `api/` | `/var/www/html/stagingapi.resortwala.com/` |

### Production Environment

| Component | Source | Destination |
|-----------|--------|-------------|
| Customer App | `client-customer/` | `/var/www/html/resortwala.com/` |
| Vendor App | `client-vendor/` | `/var/www/html/vendor.resortwala.com/` |
| Admin App | `client-admin/` | `/var/www/html/admin.resortwala.com/` |
| API | `api/` | `/var/www/html/api.resortwala.com/` |

## Deployment Process

### For Frontend Apps (React)

1. `npm install` - Install dependencies
2. `npm run build` - Build production bundle
3. Backup current deployment
4. Clear old files (except `.env`)
5. Copy new build to destination
6. Set permissions

### For API (Laravel)

1. Backup current deployment (excluding `storage` and `.env`)
2. Preserve `.env` and `storage` directory
3. Copy new code
4. Restore `.env` and `storage`
5. `composer install --no-dev --optimize-autoloader`
6. Set permissions (`www-data:www-data`)
7. Clear Laravel caches
8. Restart PHP-FPM

## Important Notes

### Environment Files (.env)

- `.env` files are **NEVER** overwritten during deployment
- They are preserved on the server
- If `.env` doesn't exist, you must create it manually on the server

### Storage Directory

- `storage/` directory is **NEVER** deleted during deployment
- Uploaded files, logs, and sessions are preserved
- Only code files are updated

### Backups

- Each deployment creates a backup: `{path}_backup_{timestamp}.tar.gz`
- Backups are stored in the same directory as the deployment
- Use backups for quick rollback if needed

## Rollback Procedure

If a deployment fails or causes issues:

```bash
# SSH into server
ssh root@77.37.47.243

# Find the backup
ls -lt /var/www/html/stagingapi.resortwala.com_backup_*.tar.gz | head -1

# Extract the backup
cd /var/www/html/stagingapi.resortwala.com
tar -xzf /var/www/html/stagingapi.resortwala.com_backup_20260127_143000.tar.gz

# Restart PHP-FPM
systemctl restart php8.2-fpm
```

## Troubleshooting

### Deployment fails with "Permission denied"

**Solution**: Ensure SSH key is added to server
```powershell
# Copy your SSH public key to server
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@77.37.47.243 "cat >> ~/.ssh/authorized_keys"
```

### "Failed to clone repository"

**Solution**: Update Git repository URL in `deploy_from_git.sh`
```bash
# Edit line 13
REPO_URL="https://github.com/yourusername/resortwala.git"
```

### Frontend build fails

**Solution**: Check Node.js version on server
```bash
ssh root@77.37.47.243 "node --version"
# Should be v18 or higher
```

### Composer install fails

**Solution**: Increase PHP memory limit
```bash
ssh root@77.37.47.243
php -d memory_limit=-1 /usr/local/bin/composer install
```

### API returns 500 error after deployment

**Solution**: Check Laravel logs and clear cache
```bash
ssh root@77.37.47.243
cd /var/www/html/stagingapi.resortwala.com
tail -50 storage/logs/laravel.log
php artisan config:clear
php artisan cache:clear
systemctl restart php8.2-fpm
```

## Configuration

### Update Git Repository URL

Edit `deploy_from_git.sh` line 13:
```bash
REPO_URL="https://github.com/yourusername/resortwala.git"
```

### Change Server IP

Edit `deploy_auto.ps1` line 30:
```powershell
[string]$ServerIP = "77.37.47.243"
```

## Best Practices

1. **Always test on beta first** before deploying to production
2. **Create a release branch** from tested master code
3. **Tag releases** for easy tracking: `git tag v1.0.0 && git push --tags`
4. **Monitor logs** after deployment for any errors
5. **Keep backups** for at least 7 days
6. **Document changes** in commit messages

## Deployment Checklist

Before deploying to production:

- [ ] All changes tested on beta environment
- [ ] Database migrations tested (if any)
- [ ] `.env` variables updated on server (if needed)
- [ ] Team notified about deployment
- [ ] Backup of current production taken
- [ ] Deployment scheduled during low-traffic time
- [ ] Rollback plan ready

## Support

For deployment issues:
1. Check server logs: `/var/log/nginx/error.log`
2. Check Laravel logs: `storage/logs/laravel.log`
3. Check deployment backups
4. Contact server administrator if needed
