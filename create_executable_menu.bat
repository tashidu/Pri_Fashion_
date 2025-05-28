@echo off
title Pri Fashion - Create Executable Menu
color 0B

:menu
cls
echo.
echo  ██████╗ ██████╗ ██╗    ███████╗ █████╗ ███████╗██╗  ██╗██╗ ██████╗ ███╗   ██╗
echo  ██╔══██╗██╔══██╗██║    ██╔════╝██╔══██╗██╔════╝██║  ██║██║██╔═══██╗████╗  ██║
echo  ██████╔╝██████╔╝██║    █████╗  ███████║███████╗███████║██║██║   ██║██╔██╗ ██║
echo  ██╔═══╝ ██╔══██╗██║    ██╔══╝  ██╔══██║╚════██║██╔══██║██║██║   ██║██║╚██╗██║
echo  ██║     ██║  ██║██║    ██║     ██║  ██║███████║██║  ██║██║╚██████╔╝██║ ╚████║
echo  ╚═╝     ╚═╝  ╚═╝╚═╝    ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo.
echo                          Create Executable Menu
echo ===============================================================================
echo.
echo Choose how you want to create an executable for Pri Fashion:
echo.
echo [1] Create Desktop Shortcut (Recommended - Quick & Easy)
echo [2] Create PowerShell Executable (ps2exe method)
echo [3] Create Node.js Executable (pkg method)
echo [4] Open Guide Document
echo [5] Test Current Setup
echo [6] Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto shortcut
if "%choice%"=="2" goto powershell
if "%choice%"=="3" goto nodejs
if "%choice%"=="4" goto guide
if "%choice%"=="5" goto test
if "%choice%"=="6" goto exit
goto menu

:shortcut
cls
echo Creating Desktop Shortcut...
echo.
powershell -ExecutionPolicy Bypass -File "create_desktop_shortcut.ps1"
pause
goto menu

:powershell
cls
echo Creating PowerShell Executable...
echo.
echo This method requires PowerShell and ps2exe module.
echo You may need to run as Administrator.
echo.
powershell -ExecutionPolicy Bypass -File "create_exe.ps1"
pause
goto menu

:nodejs
cls
echo Creating Node.js Executable...
echo.
echo This method requires Node.js and pkg module.
echo.
node create_node_exe.js
pause
goto menu

:guide
cls
echo Opening Guide Document...
echo.
if exist "CREATE_EXECUTABLE_GUIDE.md" (
    start notepad "CREATE_EXECUTABLE_GUIDE.md"
    echo Guide opened in Notepad.
) else (
    echo Guide document not found!
)
pause
goto menu

:test
cls
echo Testing Current Setup...
echo.
echo Testing run_desktop.bat...
if exist "run_desktop.bat" (
    echo ✅ run_desktop.bat found
) else (
    echo ❌ run_desktop.bat not found
)

echo.
echo Testing Node.js...
node --version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js is installed
    node --version
) else (
    echo ❌ Node.js not found
)

echo.
echo Testing PowerShell...
powershell -Command "Write-Host '✅ PowerShell is available'"

echo.
echo Testing icon file...
if exist "assets\icon.ico" (
    echo ✅ Icon file found
) else (
    echo ❌ Icon file not found at assets\icon.ico
)

echo.
pause
goto menu

:exit
echo.
echo Thank you for using Pri Fashion!
echo.
pause
exit /b 0
