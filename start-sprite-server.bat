@echo off
echo ========================================
echo   Starting Sprite Generation Server
echo ========================================
echo.
cd /d "%~dp0public\medication_gamification"
echo Current directory: %CD%
echo.
echo Starting server on http://localhost:3002
echo Press Ctrl+C to stop the server
echo.
node sprite-generation-server.js
pause
