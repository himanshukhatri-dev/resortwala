# Local Development Setup

This guide will help you set up the ResortWala application locally for development.

## Environment Strategy

- **`master` branch** → Local Development & Beta/Staging Deployment
- **`release` branch** → Production Deployment

## Prerequisites

1. **Docker Desktop** (for running MySQL, Redis, etc.)
2. **Node.js** (v18 or higher)
3. **PHP** (v8.2 or higher)
4. **Composer**

## Custom Domain Setup

To use `local.resortwala.com`, you must add an entry to your Windows hosts file.

1. Open Notepad as **Administrator**.
2. Open `C:\Windows\System32\drivers\etc\hosts`.
3. Add the following line at the end:
   ```
   127.0.0.1  local.resortwala.com
   ```
4. Save the file.

---

## Quick Start (Automated)

We have created scripts to automate the entire setup process.

### 1. Initial Setup
Run this once to configure Docker, environment files, and database:
```powershell
.\setup_local.ps1
```

### 2. Daily Development
Run this to start all servers (Database, API, and three Frontends):
```powershell
.\start_local.ps1
```
This script will open a separate terminal for each service.

---

## Manual Setup (Step-by-Step)

If you prefer to run things manually:

### 1. Start Database (Docker)
```bash
docker-compose -f docker-compose.local.yml up -d
```
Starts MySQL on `localhost:3306` and Adminer on `localhost:8080`.

### 2. Setup API
```bash
cd api
cp .env.local .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve --host=local.resortwala.com --port=8000
```
API available at: `http://local.resortwala.com/api` (via Proxy) or `http://local.resortwala.com:8000` (Direct)

### 3. Setup Frontends
In each frontend directory (`client-customer`, `client-vendor`, `client-admin`):
```bash
cp .env.local .env
npm install
npm run dev
```

---

## Environment Files

### API (`api/.env.local`)
- **DB_HOST**: `127.0.0.1`
- **DB_PORT**: `3306`
- **DB_DATABASE**: `resortwala_local`
- **APP_URL**: `http://local.resortwala.com`

### Frontend (`.env.local`)
- **VITE_API_URL**: `http://local.resortwala.com/api`


## Database Setup

### Option 1: Fresh Database

```bash
cd api
php artisan migrate:fresh --seed
```

### Option 2: Copy from Staging

```bash
# SSH into server
ssh root@77.37.47.243

# Dump staging database
mysqldump -u resortwala_staging -p'StagingPass2026' resortwala_staging > /tmp/staging_dump.sql

# Exit SSH
exit

# Download dump
scp root@77.37.47.243:/tmp/staging_dump.sql ./staging_dump.sql

# Import to local
mysql -u root -p resortwala_local < staging_dump.sql
```

## Development Workflow

### Working on Features

1. Always work on `master` branch for development
2. Test locally using `http://localhost:*`
3. Push to `master` to deploy to **beta.resortwala.com**
4. Once tested on beta, merge `master` → `release` for production

### Testing API Endpoints

```bash
# Test local API
curl http://localhost:8000/api/properties

# Test staging API
curl https://beta.resortwala.com/api/properties

# Test production API
curl https://resortwala.com/api/properties
```

## Deployment

### Deploy to Beta (Staging)

```bash
# From master branch
git push origin master

# Or use deploy script
./deploy.ps1 -Environment Beta
```

### Deploy to Production

```bash
# Merge master to release
git checkout release
git merge master
git push origin release

# Or use deploy script
./deploy.ps1 -Environment Production
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8000 (API)
npx kill-port 8000

# Kill process on port 5173 (Customer)
npx kill-port 5173
```

### Database Connection Issues

```bash
# Check if MySQL is running
docker ps | grep mysql

# Restart MySQL
docker-compose restart mysql
```

### Clear Laravel Cache

```bash
cd api
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

## Project Structure

```
resortwala/
├── api/                    # Laravel Backend
├── client-customer/        # Customer React App
├── client-vendor/          # Vendor React App
├── client-admin/           # Admin React App
├── docker-compose.yml      # Local services
├── nginx_beta.conf         # Beta/Staging nginx config
├── nginx_production.conf   # Production nginx config
└── deploy.ps1             # Deployment script
```

## Support

For issues, contact the development team or check the main README.md
