# Pri Fashion Desktop Application - Create Executable Guide

This guide provides multiple methods to create an executable (.exe) file for your Pri Fashion desktop application.

## Method 1: Using PowerShell and ps2exe (Recommended)

### Step 1: Install ps2exe
Open PowerShell as Administrator and run:
```powershell
Install-Module -Name ps2exe -Force
```

### Step 2: Convert PowerShell script to EXE
```powershell
ps2exe -inputFile "PriFashionLauncher.ps1" -outputFile "PriFashion.exe" -iconFile "assets\icon.ico" -title "Pri Fashion Desktop Application" -description "Pri Fashion Management System" -company "Pri Fashion" -version "1.0.0.0" -noConsole
```

If you want to keep the console window visible:
```powershell
ps2exe -inputFile "PriFashionLauncher.ps1" -outputFile "PriFashion.exe" -iconFile "assets\icon.ico" -title "Pri Fashion Desktop Application" -description "Pri Fashion Management System" -company "Pri Fashion" -version "1.0.0.0"
```

## Method 2: Using Node.js and pkg

### Step 1: Install pkg globally
```bash
npm install -g pkg
```

### Step 2: Create package.json entry for the launcher
Add this to your package.json:
```json
{
  "bin": {
    "pri-fashion": "./launcher.js"
  },
  "pkg": {
    "scripts": ["launcher.js"],
    "targets": ["node18-win-x64"],
    "outputPath": "dist"
  }
}
```

### Step 3: Create the executable
```bash
pkg launcher.js --target node18-win-x64 --output PriFashion.exe
```

## Method 3: Using Bat to Exe Converter (Free Online Tools)

### Option A: Using Advanced BAT to EXE Converter
1. Download from: https://www.battoexeconverter.com/
2. Load your `PriFashion.bat` file
3. Set icon to `assets\icon.ico`
4. Configure options and convert

### Option B: Using Quick Batch File Compiler
1. Download from: http://www.abyssmedia.com/quickbfc/
2. Load your `PriFashion.bat` file
3. Set icon and compile

## Method 4: Using Windows Built-in IExpress

### Step 1: Create IExpress package
1. Run `iexpress.exe` from Windows
2. Choose "Create new Self Extraction Directive file"
3. Choose "Extract files and run an installation command"
4. Set package title: "Pri Fashion Desktop Application"
5. Add your batch file and any required files
6. Set the install program to your batch file
7. Choose save location and create

## Method 5: Create Desktop Shortcut (Simplest)

### Step 1: Create shortcut script
```batch
@echo off
cd /d "C:\Users\tashi\OneDrive\Desktop\System Development Project\pri new"
call run_desktop.bat
```

### Step 2: Create shortcut
1. Right-click on desktop
2. New > Shortcut
3. Browse to your `PriFashion.bat` file
4. Name it "Pri Fashion"
5. Right-click shortcut > Properties
6. Change icon to `assets\icon.ico`

## Method 6: Using Electron Builder (Advanced)

Since you already have Electron setup, you can modify your build process:

### Step 1: Update package.json
```json
{
  "main": "launcher.js",
  "scripts": {
    "build-launcher": "electron-builder --config.productName='Pri Fashion Launcher' --config.appId='com.prifashion.launcher'"
  }
}
```

## Recommended Approach

**For immediate use**: Use Method 5 (Desktop Shortcut) - it's the simplest and works immediately.

**For distribution**: Use Method 1 (PowerShell + ps2exe) - it creates a proper executable with icon and metadata.

**For advanced users**: Use Method 2 (Node.js + pkg) - gives you more control over the packaging process.

## Files Created

1. `PriFashionLauncher.ps1` - PowerShell version of your launcher
2. `launcher.js` - Node.js version of your launcher  
3. `PriFashion.bat` - Simple batch file wrapper
4. This guide file

## Troubleshooting

### If PowerShell execution is restricted:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### If Node.js pkg fails:
Make sure you have the latest version of Node.js and pkg installed.

### If batch file doesn't work:
Check that the path in the batch file matches your actual project location.

## Next Steps

1. Choose your preferred method from above
2. Follow the steps for that method
3. Test the created executable
4. Place the executable on your desktop or in a convenient location
5. Double-click to run your Pri Fashion application!

The executable will automatically:
- Check for Node.js installation
- Install dependencies if needed
- Build the React frontend if needed
- Start your Pri Fashion desktop application
