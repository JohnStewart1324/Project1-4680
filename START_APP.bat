@echo off
echo ========================================
echo   StockAI - Real-Time Stock Analysis
echo ========================================
echo.
echo Starting server...
start "StockAI Server" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 3 /nobreak >nul
echo.
echo Starting Electron app...
npm run electron
