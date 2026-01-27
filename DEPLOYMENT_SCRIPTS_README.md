# Deployment Scripts Summary

## Created Files

### 1. `deploy_from_git.sh` - Server-Side Deployment Script
- **Purpose**: Runs on the server to pull code from Git and deploy
- **Features**:
  - Clones specified branch from Git repository
  - Builds React frontends (`npm run build`)
  - Deploys Laravel API with `composer install`
  - Creates automatic backups before deployment
  - Preserves `.env` files and `storage` directories
  - Sets proper permissions
  - Clears Laravel caches
  - Restarts PHP-FPM

### 2. `deploy_auto.ps1` - Local Trigger Script
- **Purpose**: Run from your local machine to trigger deployment
- **Features**:
  - Uploads deployment script to server
  - Validates environment and branch combination
  - Executes deployment on server
  - Shows deployment progress
  - Displays URLs after completion

### 3. `DEPLOYMENT_GUIDE.md` - Complete Documentation
- Usage instructions
- Deployment process explanation
- Troubleshooting guide
- Best practices
- Rollback procedures

## Usage

### Deploy to Beta (Staging)
```powershell
# 1. Push code to master branch
git push origin master

# 2. Deploy
.\deploy_auto.ps1 -Environment beta -Branch master
```

### Deploy to Production
```powershell
# 1. Merge to release branch
git checkout release
git merge master
git push origin release

# 2. Deploy
.\deploy_auto.ps1 -Environment production -Branch release
```

## Important Configuration

Before first use, update the Git repository URL in `deploy_from_git.sh` (line 13):
```bash
REPO_URL="https://github.com/yourusername/resortwala.git"
```

## Key Features

✅ **Git-Based**: Server pulls from repository (no local file uploads)  
✅ **Automatic Backups**: Creates timestamped backups before each deployment  
✅ **Safe Deployments**: Preserves `.env` and `storage` directories  
✅ **Environment Separation**: Beta (master) and Production (release) branches  
✅ **Rollback Ready**: Easy rollback using backup files  
✅ **Validation**: Checks environment/branch combinations  
✅ **Production Safety**: Requires confirmation for production deployments  

## Next Steps

1. **Update Git URL** in `deploy_from_git.sh`
2. **Test on Beta** first: `.\deploy_auto.ps1 -Environment beta -Branch master`
3. **Verify deployment** at https://beta.resortwala.com
4. **Deploy to Production** when ready: `.\deploy_auto.ps1 -Environment production -Branch release`
