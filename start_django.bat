@echo off
cd /d "%~dp0"

REM Set environment variables to force use of virtual environment
set PYTHONHOME=
set PYTHONPATH=%~dp0
set PATH=%~dp0new_env\Scripts;%PATH%

REM Use the virtual environment Python directly
"%~dp0new_env\Scripts\python.exe" "%~dp0backend\manage.py" runserver 127.0.0.1:8000
