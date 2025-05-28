const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const url = require('url');

// Simple isDev check
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath);

// Simple port finder
function findFreePort(startPort, callback) {
  const server = http.createServer();
  server.listen(startPort, (err) => {
    if (err) {
      findFreePort(startPort + 1, callback);
    } else {
      const port = server.address().port;
      server.close(() => callback(null, port));
    }
  });
  server.on('error', () => {
    findFreePort(startPort + 1, callback);
  });
}

// Simple kill process function
function killProcess(pid, signal = 'SIGTERM') {
  try {
    process.kill(pid, signal);
  } catch (err) {
    console.error('Error killing process:', err);
  }
}

let mainWindow;
let djangoProcess;
let expressServer;
let frontendPort = 3000; // Default port for serving React build

// Keep a global reference of the window object
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    autoHideMenuBar: false
  });

  // Set application menu
  createMenu();

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Focus on window
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom + 1);
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom - 1);
            }
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.setZoomLevel(0);
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Pri Fashion',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Pri Fashion',
              message: 'Pri Fashion Management System',
              detail: 'Version 1.0.0\nA comprehensive fashion garment management system.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Start Django backend server
async function startDjangoServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Django server...');

    const batchPath = isDev
      ? path.resolve(__dirname, '../start_django.bat')
      : path.join(process.resourcesPath, 'app.asar.unpacked/start_django.bat');

    console.log('Batch path:', batchPath);
    console.log('isDev:', isDev);
    console.log('__dirname:', __dirname);

    djangoProcess = spawn('cmd.exe', ['/c', batchPath], {
      cwd: isDev ? path.resolve(__dirname, '..') : path.join(process.resourcesPath, 'app.asar.unpacked'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    djangoProcess.stdout.on('data', (data) => {
      console.log(`Django: ${data}`);
      if (data.toString().includes('Starting development server')) {
        console.log('Django server started successfully');
        resolve();
      }
    });

    djangoProcess.stderr.on('data', (data) => {
      console.error(`Django Error: ${data}`);
    });

    djangoProcess.on('error', (error) => {
      console.error('Failed to start Django server:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('Django server started (timeout)');
      resolve();
    }, 30000);
  });
}

// Start HTTP server to serve React build
async function startFrontendServer() {
  return new Promise((resolve, reject) => {
    const buildPath = isDev
      ? path.join(__dirname, '../frontend/build')
      : path.join(process.resourcesPath, 'app.asar.unpacked/frontend/build');

    // Create HTTP server
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url);
      let pathname = parsedUrl.pathname;

      // Default to index.html for root
      if (pathname === '/') {
        pathname = '/index.html';
      }

      // Handle static files
      const filePath = path.join(buildPath, pathname);

      // Check if file exists
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          // File doesn't exist, serve index.html for React Router
          const indexPath = path.join(buildPath, 'index.html');
          fs.readFile(indexPath, (err, data) => {
            if (err) {
              res.writeHead(404);
              res.end('Not found');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          });
        } else {
          // Serve the file
          fs.readFile(filePath, (err, data) => {
            if (err) {
              res.writeHead(500);
              res.end('Server error');
              return;
            }

            // Set content type based on file extension
            const ext = path.extname(filePath);
            let contentType = 'text/plain';
            switch (ext) {
              case '.html': contentType = 'text/html'; break;
              case '.js': contentType = 'application/javascript'; break;
              case '.css': contentType = 'text/css'; break;
              case '.json': contentType = 'application/json'; break;
              case '.png': contentType = 'image/png'; break;
              case '.jpg': contentType = 'image/jpeg'; break;
              case '.svg': contentType = 'image/svg+xml'; break;
            }

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
          });
        }
      });
    });

    // Find free port and start server
    findFreePort(3000, (err, freePort) => {
      if (err) {
        reject(err);
        return;
      }

      frontendPort = freePort;
      expressServer = server.listen(frontendPort, '127.0.0.1', () => {
        console.log(`Frontend server running on http://127.0.0.1:${frontendPort}`);
        resolve();
      });
    });
  });
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Start frontend server first
    await startFrontendServer();

    // Create main window
    createWindow();

    // Load the frontend
    mainWindow.loadURL(`http://127.0.0.1:${frontendPort}`);

    // Note: Django server should be started separately
    console.log('Frontend started. Make sure Django server is running on http://127.0.0.1:8000');

  } catch (error) {
    console.error('Failed to start frontend server:', error);
    dialog.showErrorBox('Startup Error', 'Failed to start the frontend server. Please try again.');
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Cleanup on app quit
app.on('before-quit', () => {
  console.log('Cleaning up servers...');

  if (djangoProcess) {
    killProcess(djangoProcess.pid, 'SIGTERM');
    console.log('Django process terminated');
  }

  if (expressServer) {
    expressServer.close(() => {
      console.log('HTTP server closed');
    });
  }
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
    // Ignore certificate errors for local development
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
