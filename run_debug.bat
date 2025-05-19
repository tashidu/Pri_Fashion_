@echo off
echo Starting Django server in debug mode...
cd backend
..\system_env\Scripts\python.exe -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings'); import django; django.setup(); from django.core.management import execute_from_command_line; execute_from_command_line(['manage.py', 'runserver', '--traceback'])"
pause
