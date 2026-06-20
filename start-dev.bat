@echo off
setlocal

cd /d "%~dp0"

echo.
echo Starting Library Seat Management System...
echo Project: %cd%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not available in PATH.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo node_modules not found. Installing dependencies first...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo.
if "%PORT%"=="" (
  echo App will open at: http://localhost:3000
) else (
  echo App will open at: http://localhost:%PORT%
)
echo Press Ctrl+C to stop the server.
echo.

call npm run dev

echo.
echo Server stopped.
pause
