# ✅ Component-Based Deployment - Complete!

## What's New

The deployment system now supports **component selection**! You can deploy individual apps or all components at once.

## Interactive Deployment

Just run the script and answer 3 simple questions:

```powershell
.\deploy_auto.ps1
```

**Questions:**
1. **Environment**: Beta or Production?
2. **Branch**: master or release?
3. **Component**: Which app to deploy?
   - Customer App
   - Admin App
   - Vendor App
   - API (Laravel)
   - All Components

## Example Usage

### Deploy Only API (Fast Backend Updates)
```powershell
.\deploy_auto.ps1
# Answer: Beta → master → API
```

### Deploy Only Customer App (Frontend Changes)
```powershell
.\deploy_auto.ps1
# Answer: Beta → master → Customer App
```

### Deploy Everything
```powershell
.\deploy_auto.ps1
# Answer: Beta → master → All Components
```

## Command-Line Mode

Skip the questions by providing parameters:

```powershell
# Deploy only API to beta
.\deploy_auto.ps1 -Environment beta -Branch master -Component api

# Deploy all to production
.\deploy_auto.ps1 -Environment production -Branch release -Component all
```

## Benefits

✅ **Faster Deployments** - Deploy only what changed  
✅ **Less Risk** - Update one component at a time  
✅ **Time Saving** - API deployment takes ~2 min vs ~10 min for all  
✅ **Flexible** - Choose what to deploy based on your changes  

## Before First Use

Update Git repository URL in `deploy_from_git.sh` (line 17):
```bash
REPO_URL="https://github.com/yourusername/resortwala.git"
```

## Ready to Deploy!

```powershell
.\deploy_auto.ps1
```

That's it! The script will guide you through the rest.
