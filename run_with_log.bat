@echo off
echo Starting Django server with output redirected to server.log...
cd backend
..\system_env\Scripts\python.exe manage.py runserver > ..\server.log 2>&1
echo Server started. Check server.log for output.
