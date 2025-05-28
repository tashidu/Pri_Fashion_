# Pri Fashion Desktop Application

This guide will help you set up and run the Pri Fashion Management System as a desktop application using Electron.

## Prerequisites

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Python** (already installed in your virtual environment)
   - Your virtual environment: `new_env`

3. **React Frontend** (already built)
   - Located in: `frontend/build`

## Quick Start

### Option 1: Using Batch Files (Recommended)

1. **Install Dependencies** (First time only):
   ```bash
   npm install
   ```

2. **Run the Desktop Application**:
   - Double-click `run_desktop.bat`
   - Or run from command line: `npm start`

3. **Create Desktop Shortcut**:
   - Double-click `create_desktop_shortcut.bat`
   - This will create a "Pri Fashion" shortcut on your desktop

### Option 2: Manual Setup

1. **Install Electron Dependencies**:
   ```bash
   npm install electron electron-is-dev express find-free-port tree-kill
   npm install --save-dev concurrently electron-builder wait-on
   ```

2. **Build React Frontend** (if not already built):
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

3. **Start the Application**:
   ```bash
   npm start
   ```

## Development Mode

For development with hot reload:

1. **Run Development Mode**:
   ```bash
   npm run dev
   ```
   - This starts both React development server and Electron
   - Changes to React code will auto-reload

2. **Or use the batch file**:
   - Double-click `run_desktop_dev.bat`

## Building for Distribution

To create an installer for distribution:

1. **Build the Application**:
   ```bash
   npm run dist
   ```
   - Or double-click `build_desktop.bat`

2. **Find the Installer**:
   - The installer will be created in the `dist` folder
   - Look for `Pri Fashion Setup 1.0.0.exe`

## File Structure

```
pri-fashion/
├── electron/
│   ├── main.js          # Main Electron process
│   └── preload.js       # Preload script for security
├── frontend/
│   └── build/           # React production build
├── backend/             # Django backend
├── assets/
│   └── icon.png         # Application icon
├── package.json         # Electron configuration
├── run_desktop.bat      # Quick start script
├── run_desktop_dev.bat  # Development mode script
└── build_desktop.bat    # Build for distribution script
```

## How It Works

1. **Electron Main Process** (`electron/main.js`):
   - Starts Django backend server on port 8000
   - Serves React build files on a local port (3001+)
   - Creates the desktop window
   - Manages application lifecycle

2. **Django Backend**:
   - Runs on `http://127.0.0.1:8000`
   - Provides API endpoints for the frontend

3. **React Frontend**:
   - Served from production build
   - Communicates with Django backend via API calls

## Troubleshooting

### Common Issues

1. **"Node.js not found"**:
   - Install Node.js from https://nodejs.org/
   - Restart command prompt after installation

2. **"Dependencies not installed"**:
   - Run `npm install` in the project root directory

3. **"Django server won't start"**:
   - Check if Python virtual environment is activated
   - Ensure Django dependencies are installed in `new_env`

4. **"React build not found"**:
   - Run `cd frontend && npm run build && cd ..`

5. **"Port already in use"**:
   - Close any existing Django or React development servers
   - The application will automatically find free ports

### Manual Debugging

1. **Check Django Backend**:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Check React Build**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Check Electron**:
   ```bash
   npm run electron
   ```

## Features

- **Desktop Application**: Native desktop experience with window management
- **Auto-start**: Automatically starts both Django backend and React frontend
- **Production Ready**: Uses React production build for better performance
- **Easy Distribution**: Can be packaged into an installer
- **Cross-platform**: Works on Windows, macOS, and Linux

## Scripts Available

- `npm start` - Start the desktop application
- `npm run dev` - Start in development mode with hot reload
- `npm run dist` - Build for distribution
- `npm run electron` - Start Electron only (requires servers to be running)
- `npm run frontend:build` - Build React frontend
- `npm run frontend:dev` - Start React development server

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Ensure all prerequisites are installed
3. Try running the manual debugging steps
4. Check the console output for error messages

The desktop application provides the same functionality as the web version but with a native desktop experience and easier deployment.
