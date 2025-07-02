@echo off
echo Pri Fashion Database Switcher
echo ============================
echo.
echo Current database configuration:
if exist ".env" (
    findstr "DATABASE_MODE" .env 2>nul
    if errorlevel 1 (
        echo DATABASE_MODE not found in .env - using local database
    )
) else (
    echo No .env file found - using default local database
)
echo.
echo Choose database configuration:
echo [1] Local MySQL Database
echo [2] Azure MySQL Database
echo [3] Exit
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto local
if "%choice%"=="2" goto azure
if "%choice%"=="3" goto exit
echo Invalid choice. Please try again.
pause
goto start

:local
echo.
echo Switching to Local MySQL Database...
if exist ".env.local" (
    copy ".env.local" ".env" >nul
    echo ✅ Switched to local database configuration
) else (
    copy ".env.template" ".env" >nul
    echo ✅ Created .env from template for local database
    echo ⚠️  Please update .env with your local database credentials
)
echo.
echo Local database configuration active.
pause
goto end

:azure
echo.
echo Switching to Azure MySQL Database...
if exist ".env.azure" (
    copy ".env.azure" ".env" >nul
    echo ✅ Switched to Azure database configuration
    echo.
    echo ⚠️  Make sure your .env.azure file has the correct Azure database credentials:
    echo    - DATABASE_HOST=your-server.mysql.database.azure.com
    echo    - DATABASE_USER=your-admin-username
    echo    - DATABASE_PASSWORD=your-password
    echo    - DATABASE_NAME=prifashion
) else (
    echo ❌ .env.azure file not found!
    echo Please create .env.azure with your Azure database credentials first.
    pause
    goto start
)
echo.
echo Azure database configuration active.
pause
goto end

:exit
echo Goodbye!
goto end

:end
echo.
echo Database configuration updated. Restart your application to apply changes.
pause
