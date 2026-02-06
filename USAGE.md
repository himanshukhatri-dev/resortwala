# Unified Local Deployment System - Usage Guide

## Quick Start
1. **Ensure Port 80 is free** (Stop IIS, Skype, or other web servers).
2. **Open Terminal** (PowerShell or Git Bash) as Administrator.
3. **Run Deployment Script**:
   ```powershell
   ./deploy.ps1
   ```
   This command will:
   - Stop any old containers.
   - Build and start the new Unified Stack.
   - Install backend/frontend dependencies automatically.
   - Wait for services to be healthy.
   - Output the access URLs.

## Access URLs
- **Main App**: [http://local.resortwala.com](http://local.resortwala.com)
- **Vendor Panel**: [http://local.resortwala.com/vendor](http://local.resortwala.com/vendor)
- **Admin Panel**: [http://local.resortwala.com/admin](http://local.resortwala.com/admin)
- **API**: [http://local.resortwala.com/api](http://local.resortwala.com/api)
- **Database**: Port 3306 (User: `root`, Pass: `root`)

## Daily Workflow
- **Start/Restart**: Just run `./deploy.ps1` again. It is idempotent.
- **Stop**: `docker-compose -f docker-compose.unified.yml --env-file .env.unified down`
- **Logs**:
  - Gateway: `docker logs -f resortwala_gateway`
  - API: `docker logs -f resortwala_api`
  - Customer: `docker logs -f resortwala_customer`

## Troubleshooting
- **502 Bad Gateway**:
  - Wait 30 seconds. The API or Frontend might still be installing dependencies.
  - Run `./deploy.ps1` again to trigger health checks.
- **Docker Build/Filesystem Errors**:
  - If you see "failed to stat" or "failed to solve" errors, your Docker cache might be corrupted.
  - Run a Deep Clean:
    ```powershell
    docker system prune -f
    ./deploy.ps1
    ```
- **Port Conflict**:
  - Edit `.env.unified` if you absolutely must change ports, but try to keep Port 80 for `gateway` to ensure `local.resortwala.com` works without a port number.

## Architecture
- **Single Entry Point**: Nginx Gateway on Port 80.
- **Service Isolation**: All apps run in Docker containers.
- **Unified Config**: All ports and secrets are in `.env.unified`.
