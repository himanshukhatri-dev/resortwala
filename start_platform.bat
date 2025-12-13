
@echo off
echo [1/6] Destroying Old Environment (Data Wipe)...
docker-compose down -v --remove-orphans
docker network prune -f

echo [2/6] Starting Fresh Containers (Static IP Mode)...
docker-compose up -d --force-recreate
echo Waiting for containers to initialize (20s)...
timeout /t 20

echo [3/6] Fixing Permissions...
docker exec resortwala_api chown -R www-data:www-data storage bootstrap/cache
docker exec resortwala_api chmod -R 775 storage bootstrap/cache

echo [4/6] Creating Database Structure...
docker exec resortwala_api php artisan migrate:fresh --force

echo [5/6] Seeding LIVE Data from MSSQL...
call npm install mysql2 mssql 
node seed_resorts.js

echo [6/6] Finalizing Configuration...
docker exec resortwala_api php artisan config:clear
docker exec resortwala_api php artisan route:clear
docker exec resortwala_api php artisan view:clear

echo ===================================================
echo DONE!
echo Dashboard: http://localhost:8000
echo Mobile API: http://192.168.1.105:8000
echo ===================================================
pause
