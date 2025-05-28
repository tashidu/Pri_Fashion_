@echo off
echo Starting Pri Fashion Desktop Application...
echo.

REM Navigate to the application directory
cd /d "%~dp0"

REM Check if the executable exists
if exist "dist\win-unpacked\Pri Fashion.exe" (
    echo Found Pri Fashion executable.
    echo.
    
    REM Kill any existing Pri Fashion processes
    taskkill /f /im "Pri Fashion.exe" 2>nul
    timeout /t 2 /nobreak >nul
    
    echo Starting Pri Fashion Desktop Application...
    start "" "dist\win-unpacked\Pri Fashion.exe"
    echo.
    echo Pri Fashion Desktop Application is starting...
    echo If you see a black screen, please close the app and run run_desktop.bat instead.
    echo.
) else (
    echo Pri Fashion executable not found!
    echo.
    echo Trying alternative method...
    echo Building and starting in development mode...
    echo.
    
    REM Check if Node.js is available
    node --version > nul 2>&1
    if %errorlevel% neq 0 (
        echo Node.js is not installed. Please install Node.js first.
        pause
        exit /b 1
    )
    
    REM Build frontend if needed
    if not exist "frontend\build" (
        echo Building React frontend...
        cd frontend
        npm run build
        cd ..
    )
    
    REM Start in development mode
    echo Starting Pri Fashion in development mode...
    npm start
)

echo.
echo You can close this window now.
pause
