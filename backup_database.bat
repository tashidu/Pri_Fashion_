@echo off
echo Pri Fashion Database Backup Tool
echo ================================
echo.

REM Create backups directory if it doesn't exist
if not exist "database_backups" mkdir database_backups

REM Get current date and time for filename
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "datestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

set "backup_file=database_backups\prifashion_backup_%datestamp%.sql"

echo Creating backup of Pri Fashion database...
echo Backup file: %backup_file%
echo.

REM Create MySQL dump
mysqldump -u root -pboossa12 --single-transaction --routines --triggers --add-drop-database --databases prifashion > "%backup_file%"

if %errorlevel% equ 0 (
    echo ✅ Backup created successfully!
    echo 📁 File: %backup_file%
    echo.
    echo 📋 To restore on another computer:
    echo    1. Install MySQL
    echo    2. Run: mysql -u root -p ^< "%backup_file%"
    echo    3. Copy your Pri Fashion application
    echo    4. Update database credentials if needed
) else (
    echo ❌ Backup failed! Please check:
    echo    - MySQL is running
    echo    - Username/password is correct
    echo    - Database 'prifashion' exists
)

echo.
pause
