@echo off
echo Starting Laravel Initialization...

echo Building and starting containers...
docker-compose up -d --build

echo Waiting for containers to come up...
timeout /t 10

echo Installing Laravel...
docker-compose exec api composer create-project laravel/laravel .

echo Setting permissions...
docker-compose exec api chown -R www-data:www-data /var/www/storage

echo Initialization Complete! 
echo Access the API at http://localhost:8000
echo Access Customer App at http://localhost:3000
echo Access Vendor App at http://localhost:3001
pause
