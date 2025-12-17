@echo off
echo ===================================================
echo   RESORTWALA UNIFIED STARTUP
echo ===================================================

echo [1/3] Starting Backend Services (Docker)...
docker-compose up -d

echo [2/3] Checking API Readiness...
timeout /t 5 >nul

echo [3/3] Starting Customer Frontend (new window)...
cd client-customer
start "ResortWala Client" npm run dev

echo ===================================================
echo   ALL SYSTEMS GO!
echo   Frontend: http://localhost:5173
echo   Backhend: http://localhost:8000
echo ===================================================
pause
