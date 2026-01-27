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

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd resortwala
git checkout master
```

### 2. Start Local Services (Docker)

```bash
# Start MySQL, Redis, and other services
docker-compose up -d
```

This will start:
- MySQL on `localhost:3306`
- Redis on `localhost:6379`
- phpMyAdmin on `localhost:8080`

### 3. Setup API (Laravel Backend)

```bash
cd api

# Install dependencies
composer install

# Copy local environment file
cp .env.local .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed

# Start Laravel development server
php artisan serve
```

API will be available at: `http://localhost:8000`

### 4. Setup Customer App (React Frontend)

```bash
cd client-customer

# Install dependencies
npm install

# Start development server
npm run dev
```

Customer app will be available at: `http://localhost:5173`

### 5. Setup Vendor App

```bash
cd client-vendor

# Install dependencies
npm install

# Start development server
npm run dev
```

Vendor app will be available at: `http://localhost:5174`

### 6. Setup Admin App

```bash
cd client-admin

# Install dependencies
npm install

# Start development server
npm run dev
```

Admin app will be available at: `http://localhost:5175`

## Environment Files

### API (.env.local)

```env
APP_NAME=ResortWala
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=resortwala_local
DB_USERNAME=root
DB_PASSWORD=root

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_HOST=localhost
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### Customer App (.env.local)

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_ENV=local
```

### Vendor App (.env.local)

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_ENV=local
```

### Admin App (.env.local)

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_ENV=local
```

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
