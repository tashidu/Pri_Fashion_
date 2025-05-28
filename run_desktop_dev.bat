@echo off
echo Pri Fashion Desktop Application - Development Mode
echo =================================================
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

REM Install frontend dependencies if needed
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Failed to install frontend dependencies.
        pause
        exit /b 1
    )
)
cd ..

REM Start Electron app in development mode
echo Starting Pri Fashion Desktop Application in development mode...
echo This will start both React development server and Electron...
npm run dev

pause
