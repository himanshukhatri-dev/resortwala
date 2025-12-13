@echo off
echo.
echo ==========================================
echo   RESORTWALA DATABASE CONNECTION CHECKER
echo ==========================================
echo.
echo [1/2] Checking if Docker containers are running...
docker ps --filter "name=resortwala_api" --filter "name=resortwala_db" --format "   [OK] Container {{.Names}} is running."
if %ERRORLEVEL% NEQ 0 (
    echo    [ERROR] Docker is not running or containers are down.
    echo    Please run: docker-compose up -d
    pause
    exit /b
)

echo.
echo [2/2] Testing Application-to-Database Connection...
echo    (Running 'php artisan migrate:status' inside resortwala_api)
echo.

docker exec resortwala_api php artisan migrate:status > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    [SUCCESS] CONNECTION EFFECTIVE! 
    echo    The Application can reach the Database.
    echo.
    echo    Technical Details:
    echo    - Host: resortwala_db
    echo    - Port: 3306 (Internal)
) else (
    echo    [FAILURE] CONNECTION FAILED!
    echo    The Application CANNOT reach the Database.
    echo.
    echo    Troubleshooting:
    echo    - Check if resortwala_db container is healthy.
    echo    - Check .env for DB_HOST=resortwala_db and DB_PORT=3306.
    echo    - View logs: docker logs resortwala_api
)

echo.
echo ==========================================
pause
