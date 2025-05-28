# Pri Fashion Desktop Application Launcher
# PowerShell script to launch the Pri Fashion desktop application

param(
    [switch]$NoLogo
)

# Set console properties
$Host.UI.RawUI.WindowTitle = "Pri Fashion Desktop Application"

if (-not $NoLogo) {
    # Clear screen and show logo
    Clear-Host
    Write-Host ""
    Write-Host "  ██████╗ ██████╗ ██╗    ███████╗ █████╗ ███████╗██╗  ██╗██╗ ██████╗ ███╗   ██╗" -ForegroundColor Cyan
    Write-Host "  ██╔══██╗██╔══██╗██║    ██╔════╝██╔══██╗██╔════╝██║  ██║██║██╔═══██╗████╗  ██║" -ForegroundColor Cyan
    Write-Host "  ██████╔╝██████╔╝██║    █████╗  ███████║███████╗███████║██║██║   ██║██╔██╗ ██║" -ForegroundColor Cyan
    Write-Host "  ██╔═══╝ ██╔══██╗██║    ██╔══╝  ██╔══██║╚════██║██╔══██║██║██║   ██║██║╚██╗██║" -ForegroundColor Cyan
    Write-Host "  ██║     ██║  ██║██║    ██║     ██║  ██║███████║██║  ██║██║╚██████╔╝██║ ╚████║" -ForegroundColor Cyan
    Write-Host "  ╚═╝     ╚═╝  ╚═╝╚═╝    ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "                          Desktop Application Starting..." -ForegroundColor Yellow
    Write-Host "===============================================================================" -ForegroundColor Gray
    Write-Host ""
}

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to run a command and check its exit code
function Invoke-SafeCommand {
    param(
        [string]$Command,
        [string]$Arguments = "",
        [string]$WorkingDirectory = $PWD,
        [string]$SuccessMessage = "",
        [string]$ErrorMessage = "Command failed"
    )
    
    try {
        if ($Arguments) {
            $process = Start-Process -FilePath $Command -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -Wait -PassThru -NoNewWindow
        } else {
            $process = Start-Process -FilePath $Command -WorkingDirectory $WorkingDirectory -Wait -PassThru -NoNewWindow
        }
        
        if ($process.ExitCode -eq 0) {
            if ($SuccessMessage) {
                Write-Host "✅ $SuccessMessage" -ForegroundColor Green
            }
            return $true
        } else {
            Write-Host "❌ $ErrorMessage (Exit code: $($process.ExitCode))" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ $ErrorMessage : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Get the script directory (where this PowerShell script is located)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[1/4] Checking Node.js installation..." -ForegroundColor Yellow

# Check if Node.js is installed
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Node.js is installed." -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Checking dependencies..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    if (-not (Invoke-SafeCommand -Command "npm" -Arguments "install" -SuccessMessage "Dependencies installed successfully." -ErrorMessage "Failed to install dependencies.")) {
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed." -ForegroundColor Green
}
Write-Host ""

Write-Host "[3/4] Building React frontend..." -ForegroundColor Yellow

# Change to frontend directory and build if needed
Set-Location "frontend"
if (-not (Test-Path "build")) {
    Write-Host "🔨 Building React application..." -ForegroundColor Yellow
    if (-not (Invoke-SafeCommand -Command "npm" -Arguments "run build" -SuccessMessage "React frontend built successfully." -ErrorMessage "Failed to build React frontend.")) {
        Set-Location $ScriptDir
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ React frontend already built." -ForegroundColor Green
}

# Return to script directory
Set-Location $ScriptDir
Write-Host ""

Write-Host "[4/4] Starting Pri Fashion Desktop Application..." -ForegroundColor Yellow
Write-Host "🚀 Launching application..." -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Please wait while the application loads..." -ForegroundColor Yellow
Write-Host "    - Django backend server starting..." -ForegroundColor Gray
Write-Host "    - React frontend server starting..." -ForegroundColor Gray
Write-Host "    - Desktop window will open shortly..." -ForegroundColor Gray
Write-Host ""

# Start the application
try {
    & npm start
}
catch {
    Write-Host "❌ Failed to start the application: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Application has been closed." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
