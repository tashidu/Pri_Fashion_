@echo off
echo Pri Fashion Deployment Preparation
echo ==================================
echo.

REM Generate a secure secret key
echo Generating a secure secret key...
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(50))" > .env.secret_key

REM Create production environment file
echo Creating production environment file...
copy .env.production .env.prod_temp
type .env.secret_key >> .env.prod_temp
del .env.secret_key
move .env.prod_temp .env.production

echo Updating production environment file...
echo Please enter your PythonAnywhere username:
set /p pa_username=

REM Update the environment file with the username
powershell -Command "(Get-Content .env.production) -replace 'yourusername', '%pa_username%' | Set-Content .env.production"

echo Please enter your database password for PythonAnywhere:
set /p db_password=

REM Update the environment file with the database password
powershell -Command "(Get-Content .env.production) -replace 'your_database_password', '%db_password%' | Set-Content .env.production"

REM Update the WSGI file with the username
echo Updating WSGI configuration...
powershell -Command "(Get-Content backend\backend\wsgi_pythonanywhere.py) -replace 'yourusername', '%pa_username%' | Set-Content backend\backend\wsgi_pythonanywhere.py"

REM Update the settings_prod.py file with the username
echo Updating production settings...
powershell -Command "(Get-Content backend\backend\settings_prod.py) -replace 'yourusername.pythonanywhere.com', '%pa_username%.pythonanywhere.com' | Set-Content backend\backend\settings_prod.py"

REM Collect static files
echo Collecting static files...
cd backend
..\new_env\Scripts\python.exe manage.py collectstatic --noinput --settings=backend.settings_prod
cd ..

REM Update API configuration for production
echo Updating API configuration for production...
cd frontend
node update-api-config.js %pa_username%

REM Build the React frontend
echo Building React frontend...
call npm install
call npm run build
cd ..

REM Create deployment package
echo Creating deployment package...
if exist pri-fashion.zip del pri-fashion.zip
powershell Compress-Archive -Path backend, frontend\build, .env.production, requirements.txt, deployment_guide.md -DestinationPath pri-fashion.zip -Force

echo.
echo Deployment preparation complete!
echo.
echo The file pri-fashion.zip contains all the necessary files for deployment.
echo Please follow the instructions in deployment_guide.md to deploy your application.
echo.
echo Your PythonAnywhere URL will be: https://%pa_username%.pythonanywhere.com
echo.
pause
