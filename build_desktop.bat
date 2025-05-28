@echo off
echo Pri Fashion Desktop Application - Build for Distribution
echo ======================================================
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

REM Install dependencies if needed
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

REM Build the application
echo Building Pri Fashion Desktop Application...
npm run dist

if %errorlevel% equ 0 (
    echo.
    echo Build completed successfully!
    echo The installer can be found in the 'dist' folder.
    echo.
) else (
    echo.
    echo Build failed. Please check the error messages above.
    echo.
)

pause
