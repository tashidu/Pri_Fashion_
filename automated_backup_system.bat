@echo off
REM Pri Fashion Automated Backup System
REM ===================================
REM This script creates automated backups with retention policy
REM Run this daily via Windows Task Scheduler

echo Pri Fashion Automated Backup System
echo ===================================
echo Starting backup process at %date% %time%
echo.

REM Configuration
set "DB_USER=root"
set "DB_PASSWORD=boossa12"
set "DB_NAME=prifashion"
set "BACKUP_DIR=database_backups"
set "REMOTE_BACKUP_DIR=\\network-drive\prifashion_backups"
set "MAX_LOCAL_BACKUPS=7"
set "MAX_REMOTE_BACKUPS=30"

REM Create backup directories
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_DIR%\daily" mkdir "%BACKUP_DIR%\daily"
if not exist "%BACKUP_DIR%\weekly" mkdir "%BACKUP_DIR%\weekly"
if not exist "%BACKUP_DIR%\monthly" mkdir "%BACKUP_DIR%\monthly"

REM Generate timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"
set "date_only=%YYYY%-%MM%-%DD%"

REM Daily backup filename
set "daily_backup=%BACKUP_DIR%\daily\prifashion_daily_%timestamp%.sql"

echo 📦 Creating daily backup...
echo File: %daily_backup%

REM Create MySQL dump with comprehensive options
mysqldump -u %DB_USER% -p%DB_PASSWORD% ^
    --single-transaction ^
    --routines ^
    --triggers ^
    --events ^
    --add-drop-database ^
    --add-drop-table ^
    --create-options ^
    --disable-keys ^
    --extended-insert ^
    --quick ^
    --lock-tables=false ^
    --databases %DB_NAME% > "%daily_backup%"

if %errorlevel% equ 0 (
    echo ✅ Daily backup created successfully
    
    REM Verify backup file is not empty
    for %%A in ("%daily_backup%") do set "backup_size=%%~zA"
    if !backup_size! gtr 1000 (
        echo ✅ Backup verification passed (Size: !backup_size! bytes)
        
        REM Create weekly backup on Sundays
        for /f %%a in ('powershell -command "(Get-Date).DayOfWeek"') do set "day_of_week=%%a"
        if "!day_of_week!"=="Sunday" (
            echo 📅 Creating weekly backup...
            copy "%daily_backup%" "%BACKUP_DIR%\weekly\prifashion_weekly_%date_only%.sql"
            echo ✅ Weekly backup created
        )
        
        REM Create monthly backup on 1st day of month
        if "%DD%"=="01" (
            echo 📅 Creating monthly backup...
            copy "%daily_backup%" "%BACKUP_DIR%\monthly\prifashion_monthly_%YYYY%-%MM%.sql"
            echo ✅ Monthly backup created
        )
        
        REM Copy to remote location if available
        if exist "%REMOTE_BACKUP_DIR%" (
            echo 🌐 Copying to remote backup location...
            copy "%daily_backup%" "%REMOTE_BACKUP_DIR%\prifashion_remote_%timestamp%.sql"
            if !errorlevel! equ 0 (
                echo ✅ Remote backup created
            ) else (
                echo ⚠️ Remote backup failed
            )
        )
        
    ) else (
        echo ❌ Backup verification failed - file too small
        del "%daily_backup%"
        goto :error
    )
    
) else (
    echo ❌ Backup creation failed
    goto :error
)

REM Cleanup old backups (keep only specified number)
echo 🧹 Cleaning up old backups...

REM Clean daily backups (keep last 7)
for /f "skip=%MAX_LOCAL_BACKUPS% delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\daily\*.sql" 2^>nul') do (
    echo Deleting old daily backup: %%F
    del "%BACKUP_DIR%\daily\%%F"
)

REM Clean remote backups if accessible
if exist "%REMOTE_BACKUP_DIR%" (
    for /f "skip=%MAX_REMOTE_BACKUPS% delims=" %%F in ('dir /b /o-d "%REMOTE_BACKUP_DIR%\prifashion_remote_*.sql" 2^>nul') do (
        echo Deleting old remote backup: %%F
        del "%REMOTE_BACKUP_DIR%\%%F"
    )
)

echo.
echo 🎉 Backup process completed successfully!
echo 📊 Backup Summary:
echo    - Daily backup: %daily_backup%
echo    - Backup size: %backup_size% bytes
echo    - Time: %date% %time%

REM Log the backup
echo %date% %time% - Backup completed successfully - Size: %backup_size% bytes >> backup_log.txt

exit /b 0

:error
echo.
echo ❌ Backup process failed!
echo 🔧 Troubleshooting:
echo    1. Check if MySQL service is running
echo    2. Verify database credentials
echo    3. Ensure sufficient disk space
echo    4. Check database connectivity

REM Log the error
echo %date% %time% - Backup FAILED >> backup_log.txt

exit /b 1
