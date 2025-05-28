@echo off
echo Starting Pri Fashion Desktop Application...
echo.

REM Check if the executable exists
if exist "dist\win-unpacked\Pri Fashion.exe" (
    echo Found Pri Fashion executable. Starting application...
    start "" "dist\win-unpacked\Pri Fashion.exe"
    echo.
    echo Pri Fashion Desktop Application is starting...
    echo You can close this window now.
) else (
    echo ERROR: Pri Fashion executable not found!
    echo Please make sure you have built the application first by running:
    echo npm run dist
    echo.
    pause
)
