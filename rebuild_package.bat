@echo off
echo Pri Fashion Deployment Package Rebuild
echo =====================================
echo.

echo Creating deployment package with corrected username...
if exist pri-fashion.zip del pri-fashion.zip
powershell Compress-Archive -Path backend, frontend\build, .env.production, requirements.txt, deployment_guide.md, verify_deployment.py -DestinationPath pri-fashion.zip -Force

echo.
echo Deployment package rebuilt!
echo.
echo The file pri-fashion.zip contains all the necessary files for deployment.
echo Please follow the instructions in deployment_guide.md to deploy your application.
echo.
echo Your PythonAnywhere URL will be: https://vinukatashidu.pythonanywhere.com
echo.
pause
