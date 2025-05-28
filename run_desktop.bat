@echo off
title Pri Fashion Desktop Application
color 0B
echo.
echo  ██████╗ ██████╗ ██╗    ███████╗ █████╗ ███████╗██╗  ██╗██╗ ██████╗ ███╗   ██╗
echo  ██╔══██╗██╔══██╗██║    ██╔════╝██╔══██╗██╔════╝██║  ██║██║██╔═══██╗████╗  ██║
echo  ██████╔╝██████╔╝██║    █████╗  ███████║███████╗███████║██║██║   ██║██╔██╗ ██║
echo  ██╔═══╝ ██╔══██╗██║    ██╔══╝  ██╔══██║╚════██║██╔══██║██║██║   ██║██║╚██╗██║
echo  ██║     ██║  ██║██║    ██║     ██║  ██║███████║██║  ██║██║╚██████╔╝██║ ╚████║
echo  ╚═╝     ╚═╝  ╚═╝╚═╝    ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo.
echo                          Desktop Application Starting...
echo ===============================================================================
echo.

echo [1/4] Checking Node.js installation...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH.
    echo Please install Node.js and try again.
    pause
    exit /b 1
)

echo ✅ Node.js is installed.
echo.

echo [2/4] Checking dependencies...
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies.
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully.
) else (
    echo ✅ Dependencies already installed.
)
echo.

echo [3/4] Building React frontend...
cd frontend
if not exist "build" (
    echo 🔨 Building React application...
    npm run build
    if %errorlevel% neq 0 (
        echo ❌ Failed to build React frontend.
        pause
        exit /b 1
    )
    echo ✅ React frontend built successfully.
) else (
    echo ✅ React frontend already built.
)
cd ..
echo.

echo [4/4] Starting Pri Fashion Desktop Application...
echo 🚀 Launching application...
echo.
echo ⏳ Please wait while the application loads...
echo    - Django backend server starting...
echo    - React frontend server starting...
echo    - Desktop window will open shortly...
echo.
npm start

pause
