@echo off
echo Pri Fashion Database Restore Tool
echo =================================
echo.

REM Check if backups directory exists
if not exist "database_backups" (
    echo ❌ No database_backups folder found!
    echo Please copy your backup files to a 'database_backups' folder first.
    pause
    exit /b 1
)

echo Available backup files:
echo.
dir /b database_backups\*.sql 2>nul
if %errorlevel% neq 0 (
    echo ❌ No backup files found in database_backups folder!
    pause
    exit /b 1
)

echo.
set /p backup_file="Enter the backup filename (without path): "

if not exist "database_backups\%backup_file%" (
    echo ❌ File not found: database_backups\%backup_file%
    pause
    exit /b 1
)

echo.
echo ⚠️  WARNING: This will replace your current 'prifashion' database!
set /p confirm="Are you sure you want to continue? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo ❌ Restore cancelled.
    pause
    exit /b 0
)

echo.
echo 🔄 Restoring database from: %backup_file%
echo.

REM Restore MySQL database
mysql -u root -pboossa12 < "database_backups\%backup_file%"

if %errorlevel% equ 0 (
    echo ✅ Database restored successfully!
    echo.
    echo 📋 Next steps:
    echo    1. Test your Pri Fashion application
    echo    2. Verify all data is present
    echo    3. Check that login credentials work
) else (
    echo ❌ Restore failed! Please check:
    echo    - MySQL is running
    echo    - Username/password is correct
    echo    - Backup file is not corrupted
)

echo.
pause
