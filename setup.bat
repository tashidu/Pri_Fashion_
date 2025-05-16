@echo off
echo Pri Fashion Management System Setup
echo ==================================
echo.

REM Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.13.3 and try again.
    exit /b 1
)

echo Python is installed.
echo.

REM Determine environment
set /p env_type="Are you setting up on a local machine or VM? (local/vm): "
if /i "%env_type%"=="local" (
    echo Setting up for local environment...
    copy .env.local .env
) else if /i "%env_type%"=="vm" (
    echo Setting up for VM environment...
    copy .env.vm .env
) else (
    echo Invalid option. Please enter 'local' or 'vm'.
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
python -m venv new_env

REM Install dependencies
echo Installing dependencies...
new_env\Scripts\pip.exe install -r requirements.txt

echo.
echo Setup complete!
echo.
echo To run the project:
if /i "%env_type%"=="local" (
    echo - Use run_local.bat
) else (
    echo - Use run_vm.bat
)
echo.
echo Thank you for using Pri Fashion Management System!
