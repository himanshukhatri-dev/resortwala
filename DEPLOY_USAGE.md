# Deployment Script Usage Examples

## Interactive Mode (Recommended)

Just run the script without any parameters and it will ask you questions:

```powershell
.\deploy_auto.ps1
```

**Example interaction:**
```
=========================================
ResortWala Deployment
=========================================

Select deployment environment:
  1. Beta (Staging)
  2. Production

Enter choice (1 or 2): 1

Select Git branch to deploy:
  1. master (recommended for beta)
  2. release

Enter choice (1 or 2): 1

Select component to deploy:
  1. Customer App
  2. Admin App
  3. Vendor App
  4. API (Laravel)
  5. All Components

Enter choice (1-5): 5

=========================================
ResortWala Automated Deployment
Environment: beta
Component: all
Branch: master
=========================================

[1/3] Uploading deployment script to server...
...
```

## Command-Line Mode

You can also provide parameters directly:

```powershell
# Deploy all components to beta
.\deploy_auto.ps1 -Environment beta -Branch master -Component all

# Deploy only API to beta
.\deploy_auto.ps1 -Environment beta -Branch master -Component api

# Deploy only customer app to production
.\deploy_auto.ps1 -Environment production -Branch release -Component customer
```

## Component Options

- **customer** - Customer-facing React app
- **admin** - Admin panel React app
- **vendor** - Vendor portal React app
- **api** - Laravel backend API
- **all** - Deploy all components (default)

## Use Cases

### Deploy Only API (Quick Backend Updates)
```powershell
.\deploy_auto.ps1
# Choose: 1 (Beta) → 1 (master) → 4 (API)
```

### Deploy Only Frontend (UI Changes)
```powershell
# Customer app only
.\deploy_auto.ps1 -Environment beta -Branch master -Component customer

# Or interactively choose customer/admin/vendor
.\deploy_auto.ps1
```

### Full Deployment (All Components)
```powershell
.\deploy_auto.ps1
# Choose: 1 (Beta) → 1 (master) → 5 (All)
```

## Quick Reference

| Environment | Recommended Branch | Component | URL |
|-------------|-------------------|-----------|-----|
| Beta | `master` | all | https://beta.resortwala.com |
| Beta | `master` | api | https://beta.resortwala.com/api |
| Production | `release` | all | https://resortwala.com |

## First Time Setup

Before using the deployment script, update the Git repository URL in `deploy_from_git.sh`:

```bash
# Edit line 17 in deploy_from_git.sh
REPO_URL="https://github.com/yourusername/resortwala.git"
```

Then you're ready to deploy! Just run:
```powershell
.\deploy_auto.ps1
```

