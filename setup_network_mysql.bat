@echo off
echo Pri Fashion MySQL Network Setup
echo ===============================
echo.
echo This script will configure MySQL to accept network connections
echo so you can access your database from other computers on the same network.
echo.

echo 📋 What this script does:
echo 1. Creates a network user for MySQL
echo 2. Grants permissions to access prifashion database
echo 3. Shows your computer's IP address
echo 4. Provides connection instructions for other devices
echo.

set /p confirm="Do you want to continue? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo 🔄 Setting up network access...

REM Get computer's IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%a"
    goto :found_ip
)
:found_ip
set "ip=%ip: =%"

echo.
echo 💻 Your computer's IP address: %ip%
echo.

echo 🔄 Creating network MySQL user...
echo.

REM Create MySQL commands file
echo CREATE USER IF NOT EXISTS 'prifashion_user'@'%%' IDENTIFIED BY 'prifashion123'; > temp_mysql_commands.sql
echo GRANT ALL PRIVILEGES ON prifashion.* TO 'prifashion_user'@'%%'; >> temp_mysql_commands.sql
echo FLUSH PRIVILEGES; >> temp_mysql_commands.sql
echo SHOW GRANTS FOR 'prifashion_user'@'%%'; >> temp_mysql_commands.sql

REM Execute MySQL commands
mysql -u root -pboossa12 < temp_mysql_commands.sql

if %errorlevel% equ 0 (
    echo ✅ Network user created successfully!
    echo.
    echo 📋 Network Connection Details:
    echo ================================
    echo Host: %ip%
    echo Port: 3306
    echo Database: prifashion
    echo Username: prifashion_user
    echo Password: prifashion123
    echo.
    echo 🔧 To connect from another computer:
    echo 1. Make sure both computers are on the same network
    echo 2. Update .env file on the other computer:
    echo    DATABASE_HOST=%ip%
    echo    DATABASE_USER=prifashion_user
    echo    DATABASE_PASSWORD=prifashion123
    echo.
    echo ⚠️  Important Notes:
    echo - Make sure Windows Firewall allows MySQL (port 3306)
    echo - This only works on the same local network
    echo - Keep this computer running when using from other devices
) else (
    echo ❌ Setup failed! Please check:
    echo    - MySQL is running
    echo    - Root password is correct
)

REM Clean up
del temp_mysql_commands.sql 2>nul

echo.
pause
