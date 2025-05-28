# Pri Fashion Desktop Application

## 🎉 Your Desktop Application is Ready!

The Pri Fashion management system has been successfully packaged as a standalone desktop application.

## 📁 Files Created

- **`dist/win-unpacked/Pri Fashion.exe`** - The main executable file
- **`run_pri_fashion.bat`** - Quick launcher script
- **`create_desktop_shortcut.bat`** - Creates a desktop shortcut

## 🚀 How to Run the Application

### Method 1: Double-click the Executable
1. Navigate to: `dist/win-unpacked/`
2. Double-click **`Pri Fashion.exe`**
3. The application will start automatically with both frontend and backend

### Method 2: Use the Launcher Script
1. Double-click **`run_pri_fashion.bat`** in the main folder
2. This will start the application for you

### Method 3: Create Desktop Shortcut
1. Double-click **`create_desktop_shortcut.bat`**
2. A "Pri Fashion" shortcut will be created on your desktop
3. Double-click the desktop shortcut to run the application

## ✅ What Happens When You Run It

1. **Loading Screen** appears first with "Starting Pri Fashion..." message
2. **Django Backend** starts automatically on `http://127.0.0.1:8000`
3. **React Frontend** starts automatically on `http://127.0.0.1:3005` (or next available port)
4. **Desktop Window** loads the Pri Fashion login screen
5. **All features** work exactly like the web version

## 🔧 Port Configuration

The application automatically finds available ports:
- **Backend**: Always uses port 8000
- **Frontend**: Uses port 3005-3015 (automatically finds free port)
- **CORS**: Configured to allow multiple port ranges

## 🔧 Features Included

- ✅ Complete Django backend with database
- ✅ React frontend with all components
- ✅ Python virtual environment (embedded)
- ✅ All dependencies included
- ✅ Automatic server startup
- ✅ Professional desktop interface
- ✅ Login and authentication
- ✅ All management features (suppliers, fabrics, orders, etc.)

## 📋 System Requirements

- Windows 10 or later
- No additional software installation required
- All dependencies are bundled

## 🎯 Distribution

You can copy the entire `dist/win-unpacked/` folder to any Windows computer and it will run without requiring any installation or setup.

## 🔄 Updates

To update the application:
1. Make changes to your code
2. Run `npm run dist` to rebuild
3. The new executable will be in `dist/win-unpacked/`

## 🆘 Troubleshooting

### If you see a black screen or port error:
1. **Close any other applications** using ports 3000-3010
2. **Wait 30 seconds** for the loading screen to complete
3. **Restart the application** if it doesn't load

### If the application doesn't start:
1. **Check Windows Defender/Antivirus** (may block unsigned executables)
2. **Run as Administrator** if needed
3. **Check that all files** in `dist/win-unpacked/` are present
4. **Close other development servers** (React, Node.js, etc.)

### If login doesn't work:
1. **Wait for the loading screen** to complete fully
2. **Check that both servers started** (look for Django and Frontend messages)
3. **Try refreshing** the window (Ctrl+R)

---

**Congratulations! Your Pri Fashion system is now a professional desktop application!** 🎉
