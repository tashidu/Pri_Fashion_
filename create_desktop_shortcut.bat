@echo off
echo Creating Desktop Shortcut for Pri Fashion...

set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=Pri Fashion.lnk"
set "TARGET=%SCRIPT_DIR%run_desktop.bat"
set "ICON=%SCRIPT_DIR%assets\icon.png"

REM Create VBS script to create shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%DESKTOP%\%SHORTCUT_NAME%" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%TARGET%" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> CreateShortcut.vbs
echo oLink.Description = "Pri Fashion Management System" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

REM Execute VBS script
cscript CreateShortcut.vbs

REM Clean up
del CreateShortcut.vbs

echo Desktop shortcut created successfully!
echo You can now double-click "Pri Fashion" on your desktop to start the application.
pause
