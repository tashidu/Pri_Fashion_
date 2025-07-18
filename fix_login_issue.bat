@echo off
echo Pri Fashion Login Issue Fix
echo ===========================
echo.

echo 🔍 Diagnosing login issues...
echo.

REM Check if virtual environment exists
if not exist "env\Scripts\python.exe" (
    echo ❌ Virtual environment not found at 'env\Scripts\python.exe'
    echo.
    echo 🔧 Creating virtual environment...
    python -m venv env
    echo ✅ Virtual environment created
    echo.
    
    echo 📦 Installing dependencies...
    env\Scripts\pip.exe install -r requirements.txt
    echo ✅ Dependencies installed
    echo.
) else (
    echo ✅ Virtual environment found
)

echo 🔄 Running database migrations...
env\Scripts\python.exe backend\manage.py migrate
echo.

echo 👤 Initializing database with roles and admin user...
env\Scripts\python.exe initialize_database.py
echo.

echo 🧪 Testing database connection...
env\Scripts\python.exe -c "
import os, sys
sys.path.insert(0, 'backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from authentication.models import CustomUser, Role

print('=== ROLES ===')
for role in Role.objects.all():
    print(f'Role: {role.name}')

print()
print('=== USERS ===')
for user in CustomUser.objects.all():
    print(f'Username: {user.username}, Role: {user.role.name if user.role else \"No Role\"}')
"

echo.
echo 🎉 Login issue fix completed!
echo.
echo 📋 Your login credentials:
echo    Username: owner
echo    Password: 12345678
echo.
echo 🚀 To start the application:
echo    1. Run: start_django.bat
echo    2. Open your frontend application
echo    3. Login with the credentials above
echo.
pause
