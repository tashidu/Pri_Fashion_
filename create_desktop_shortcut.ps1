# Script to create a desktop shortcut for Pri Fashion

Write-Host "Creating Desktop Shortcut for Pri Fashion" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get current script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define paths
$targetPath = Join-Path $scriptDir "run_desktop.bat"
$iconPath = Join-Path $scriptDir "assets\icon.ico"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Pri Fashion.lnk"

# Check if target file exists
if (-not (Test-Path $targetPath)) {
    Write-Host "❌ run_desktop.bat not found at: $targetPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found run_desktop.bat" -ForegroundColor Green

# Check if icon exists
if (-not (Test-Path $iconPath)) {
    Write-Host "⚠️  Icon file not found at: $iconPath" -ForegroundColor Yellow
    Write-Host "Shortcut will be created without custom icon" -ForegroundColor Yellow
    $iconPath = $null
} else {
    Write-Host "✅ Found icon file" -ForegroundColor Green
}

try {
    # Create WScript Shell object
    $WshShell = New-Object -comObject WScript.Shell

    # Create shortcut
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $targetPath
    $Shortcut.WorkingDirectory = $scriptDir
    $Shortcut.Description = "Pri Fashion Desktop Application"
    
    if ($iconPath) {
        $Shortcut.IconLocation = $iconPath
    }
    
    # Save the shortcut
    $Shortcut.Save()
    
    Write-Host "✅ Desktop shortcut created successfully!" -ForegroundColor Green
    Write-Host "Location: $shortcutPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now double-click the 'Pri Fashion' icon on your desktop to run the application!" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Failed to create desktop shortcut: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
