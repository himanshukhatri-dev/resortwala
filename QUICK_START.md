# ResortWala Quick Start Guide

## Prerequisites Check
Before starting, ensure:
1. ✅ Docker Desktop is **running** (check system tray for whale icon)
2. ✅ Node.js is installed (`node --version`)

## Option 1: Automated Start (Recommended)
```powershell
# From project root
.\start_all.ps1
```

## Option 2: Manual Start (If script fails)

### Step 1: Start Docker Containers
```powershell
# Check Docker is running
docker --version

# Start containers
docker-compose up -d

# Verify containers are running
docker ps
```

You should see 3 containers:
- `resortwala_db` (MySQL)
- `resortwala_api` (Laravel)
- `resortwala_nginx` (Web server)

### Step 2: Start Frontend Servers

**Terminal 1 - Customer App:**
```powershell
cd client-customer
npm run dev -- --port 3002 --host
```

**Terminal 2 - Vendor App:**
```powershell
cd client-vendor
npm run dev -- --port 3003 --host
```

## Access URLs
- 🌐 Customer Site: http://localhost:3002
- 🏢 Vendor Portal: http://localhost:3003
- 🔌 API: http://localhost:8000/api/properties

## Troubleshooting

### "Site cannot be reached"
1. **Docker not running**: Start Docker Desktop
2. **Port already in use**: 
   ```powershell
   # Check what's using port 3002
   netstat -ano | findstr ":3002"
   # Kill process if needed
   taskkill /PID <process_id> /F
   ```
3. **Containers not started**: Run `docker ps` to verify

### Docker Issues
If Docker commands fail with "cannot connect":
- Open Docker Desktop application
- Wait for it to fully start (green indicator)
- Try again

### Frontend Not Loading
```powershell
# Check if dev server is running
Get-Process node

# If not, start manually (see Step 2 above)
```

## Stopping Services
```powershell
# Stop Docker containers
docker-compose down

# Stop Node processes (Ctrl+C in each terminal)
```
