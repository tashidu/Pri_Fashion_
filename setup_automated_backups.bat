@echo off
REM Setup Automated Backup System for Pri Fashion
REM =============================================
REM This script sets up Windows Task Scheduler for automated backups

echo Pri Fashion Automated Backup Setup
echo ==================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo ✅ Running with administrator privileges
echo.

REM Get current directory
set "CURRENT_DIR=%~dp0"
set "BACKUP_SCRIPT=%CURRENT_DIR%automated_backup_system.bat"
set "VERIFY_SCRIPT=%CURRENT_DIR%verify_backup_integrity.py"

echo 📁 Current directory: %CURRENT_DIR%
echo 📄 Backup script: %BACKUP_SCRIPT%
echo 📄 Verify script: %VERIFY_SCRIPT%
echo.

REM Check if backup script exists
if not exist "%BACKUP_SCRIPT%" (
    echo ❌ Backup script not found: %BACKUP_SCRIPT%
    echo Please ensure automated_backup_system.bat is in the same directory
    pause
    exit /b 1
)

REM Check if Python script exists
if not exist "%VERIFY_SCRIPT%" (
    echo ❌ Verification script not found: %VERIFY_SCRIPT%
    echo Please ensure verify_backup_integrity.py is in the same directory
    pause
    exit /b 1
)

echo ✅ All required scripts found
echo.

echo 🔧 Setting up automated backup tasks...
echo.

REM Create daily backup task
echo Creating daily backup task...
schtasks /create /tn "Pri Fashion Daily Backup" /tr "\"%BACKUP_SCRIPT%\"" /sc daily /st 02:00 /ru SYSTEM /f
if %errorlevel% equ 0 (
    echo ✅ Daily backup task created successfully
) else (
    echo ❌ Failed to create daily backup task
    goto :error
)

REM Create backup verification task (runs 30 minutes after backup)
echo Creating backup verification task...
schtasks /create /tn "Pri Fashion Backup Verification" /tr "python \"%VERIFY_SCRIPT%\"" /sc daily /st 02:30 /ru SYSTEM /f
if %errorlevel% equ 0 (
    echo ✅ Backup verification task created successfully
) else (
    echo ❌ Failed to create backup verification task
    goto :error
)

REM Create weekly cleanup task
echo Creating weekly cleanup task...
schtasks /create /tn "Pri Fashion Weekly Cleanup" /tr "forfiles /p \"%CURRENT_DIR%database_backups\daily\" /s /m *.sql /d -7 /c \"cmd /c del @path\"" /sc weekly /d SUN /st 03:00 /ru SYSTEM /f
if %errorlevel% equ 0 (
    echo ✅ Weekly cleanup task created successfully
) else (
    echo ❌ Failed to create weekly cleanup task
    goto :error
)

echo.
echo 🎉 Automated backup system setup completed!
echo.
echo 📋 Created Tasks:
echo    1. Pri Fashion Daily Backup - Runs daily at 2:00 AM
echo    2. Pri Fashion Backup Verification - Runs daily at 2:30 AM
echo    3. Pri Fashion Weekly Cleanup - Runs weekly on Sunday at 3:00 AM
echo.

echo 🔍 Viewing created tasks...
schtasks /query /tn "Pri Fashion Daily Backup"
echo.
schtasks /query /tn "Pri Fashion Backup Verification"
echo.
schtasks /query /tn "Pri Fashion Weekly Cleanup"
echo.

echo 📋 Next Steps:
echo    1. Test the backup system: run automated_backup_system.bat manually
echo    2. Test verification: run python verify_backup_integrity.py
echo    3. Check backup logs in backup_log.txt
echo    4. Review DISASTER_RECOVERY_GUIDE.md for complete procedures
echo.

echo ⚠️  Important Notes:
echo    - Backups will be stored in database_backups folder
echo    - Logs will be written to backup_log.txt and backup_verification.log
echo    - Make sure MySQL service is always running
echo    - Consider setting up remote backup location
echo.

set /p setup_remote="Do you want to set up remote backup location? (y/n): "
if /i "%setup_remote%"=="y" (
    echo.
    echo 🌐 Remote Backup Setup
    echo =====================
    echo.
    echo Please edit automated_backup_system.bat and update the following line:
    echo set "REMOTE_BACKUP_DIR=\\network-drive\prifashion_backups"
    echo.
    echo Replace with your actual network path or cloud sync folder:
    echo Examples:
    echo   - Network drive: \\server\backups\prifashion
    echo   - OneDrive: %USERPROFILE%\OneDrive\PriFashion_Backups
    echo   - Google Drive: %USERPROFILE%\Google Drive\PriFashion_Backups
    echo   - Dropbox: %USERPROFILE%\Dropbox\PriFashion_Backups
    echo.
)

echo.
echo ✅ Setup completed successfully!
echo You can now close this window.
pause
exit /b 0

:error
echo.
echo ❌ Setup failed!
echo.
echo 🔧 Troubleshooting:
echo    1. Make sure you're running as Administrator
echo    2. Check if Task Scheduler service is running
echo    3. Verify all script files are present
echo    4. Check Windows Event Log for detailed errors
echo.
pause
exit /b 1
