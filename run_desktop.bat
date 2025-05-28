@echo off
echo Pri Fashion Desktop Application
echo ===============================
echo.

REM Check if Node.js is installed
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js and try again.
    pause
    exit /b 1
)

echo Node.js is installed.
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Build React frontend
echo Building React frontend...
cd frontend
if not exist "build" (
    npm run build
    if %errorlevel% neq 0 (
        echo Failed to build React frontend.
        pause
        exit /b 1
    )
)
cd ..

REM Start Electron app
echo Starting Pri Fashion Desktop Application...
npm start

pause
