@echo off
title Stockie Desktop App
echo.
echo 🚀 Starting Stockie Desktop App...
echo.

REM Kill any existing processes on port 3001
echo 🔧 Checking for existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Killing process %%a on port 3001...
    taskkill /f /pid %%a >nul 2>&1
)

REM Kill any existing Electron processes
taskkill /f /im electron.exe >nul 2>&1

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo 🔧 Building the app...
call npm run build

echo.
echo 🚀 Starting the application...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo Desktop: Electron app will open
echo.

REM Start the development server with Electron
call npm run dev:desktop

pause