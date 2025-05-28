# Script to create Pri Fashion executable using ps2exe
# Run this script in PowerShell as Administrator

Write-Host "Pri Fashion Executable Creator" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if ps2exe is installed
try {
    Get-Module -ListAvailable -Name ps2exe | Out-Null
    Write-Host "✅ ps2exe module found" -ForegroundColor Green
}
catch {
    Write-Host "❌ ps2exe module not found. Installing..." -ForegroundColor Yellow
    try {
        Install-Module -Name ps2exe -Force -Scope CurrentUser
        Write-Host "✅ ps2exe module installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to install ps2exe. Please run as Administrator." -ForegroundColor Red
        Write-Host "Or install manually with: Install-Module -Name ps2exe -Force" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Import the module
Import-Module ps2exe

# Set paths
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$inputFile = Join-Path $scriptPath "PriFashionLauncher.ps1"
$outputFile = Join-Path $scriptPath "PriFashion.exe"
$iconFile = Join-Path $scriptPath "assets\icon.ico"

# Check if input file exists
if (-not (Test-Path $inputFile)) {
    Write-Host "❌ PriFashionLauncher.ps1 not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if icon file exists
if (-not (Test-Path $iconFile)) {
    Write-Host "⚠️  Icon file not found at $iconFile" -ForegroundColor Yellow
    Write-Host "Creating executable without custom icon..." -ForegroundColor Yellow
    $iconFile = $null
}

Write-Host "Creating executable..." -ForegroundColor Yellow
Write-Host "Input: $inputFile" -ForegroundColor Gray
Write-Host "Output: $outputFile" -ForegroundColor Gray

try {
    if ($iconFile) {
        ps2exe -inputFile $inputFile -outputFile $outputFile -iconFile $iconFile -title "Pri Fashion Desktop Application" -description "Pri Fashion Management System" -company "Pri Fashion" -version "1.0.0.0" -requireAdmin
    } else {
        ps2exe -inputFile $inputFile -outputFile $outputFile -title "Pri Fashion Desktop Application" -description "Pri Fashion Management System" -company "Pri Fashion" -version "1.0.0.0" -requireAdmin
    }
    
    if (Test-Path $outputFile) {
        Write-Host "✅ Executable created successfully!" -ForegroundColor Green
        Write-Host "Location: $outputFile" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now:" -ForegroundColor Cyan
        Write-Host "1. Double-click PriFashion.exe to run your application" -ForegroundColor White
        Write-Host "2. Copy PriFashion.exe to your desktop" -ForegroundColor White
        Write-Host "3. Create a shortcut to PriFashion.exe" -ForegroundColor White
    } else {
        Write-Host "❌ Failed to create executable" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error creating executable: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
