@echo off
echo ========================================
echo   AI Trip Planner - Auto Start
echo ========================================
echo.
echo Starting MongoDB service...
net start MongoDB 2>nul
if %errorlevel% neq 0 (
    echo MongoDB is already running or not installed as service.
)
echo.
echo Starting development servers...
echo - Client: http://localhost:3000
echo - Server: http://localhost:5000
echo.
echo Opening browser in 10 seconds...
echo Press Ctrl+C to stop the servers
echo ========================================
echo.

cd /d "%~dp0"

REM Open browser after 10 seconds (gives time for servers to start)
start /B powershell -Command "Start-Sleep -Seconds 10; Start-Process 'http://localhost:3000'"

npm run dev
