@echo off
title Stockie Web App
echo.
echo 🚀 Starting Stockie Web App...
echo.

echo 📦 Installing dependencies...
call npm install

echo.
echo 🔧 Building the app...
call npm run build:web

echo.
echo 🌐 Starting web server...
echo The app will be available at: http://localhost:4173
echo.
call npm run preview

pause
