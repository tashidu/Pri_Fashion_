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
let frontendPort = 3005; // Default port for serving React build (avoid common conflicts)

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

    // Focus on window and open dev tools for debugging
    mainWindow.webContents.openDevTools();
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

    let pythonPath, managePath, workingDir;

    if (isDev) {
      // Development mode
      pythonPath = path.resolve(__dirname, '../new_env/Scripts/python.exe');
      managePath = path.resolve(__dirname, '../backend/manage.py');
      workingDir = path.resolve(__dirname, '..');
    } else {
      // Production mode
      pythonPath = path.join(process.resourcesPath, 'python-env/Scripts/python.exe');
      managePath = path.join(process.resourcesPath, 'backend/manage.py');
      workingDir = process.resourcesPath;
    }

    console.log('Python path:', pythonPath);
    console.log('Manage path:', managePath);
    console.log('Working directory:', workingDir);
    console.log('isDev:', isDev);

    djangoProcess = spawn(pythonPath, [managePath, 'runserver', '127.0.0.1:8000'], {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONHOME: '',
        PYTHONPATH: isDev ? path.resolve(__dirname, '..') : process.resourcesPath
      }
    });

    let djangoStarted = false;

    djangoProcess.stdout.on('data', (data) => {
      console.log(`Django: ${data}`);
      if (data.toString().includes('Starting development server') && !djangoStarted) {
        djangoStarted = true;
        console.log('Django server started successfully');
        resolve();
      }
    });

    djangoProcess.stderr.on('data', (data) => {
      console.error(`Django Error: ${data}`);
      // Don't reject on stderr as Django often outputs warnings there
    });

    djangoProcess.on('error', (error) => {
      console.error('Failed to start Django server:', error);
      if (!djangoStarted) {
        reject(error);
      }
    });

    djangoProcess.on('exit', (code) => {
      console.log(`Django process exited with code ${code}`);
      if (!djangoStarted && code !== 0) {
        reject(new Error(`Django server failed to start (exit code: ${code})`));
      }
    });

    // Timeout after 15 seconds (reduced from 30)
    setTimeout(() => {
      if (!djangoStarted) {
        console.log('Django server started (timeout)');
        djangoStarted = true;
        resolve();
      }
    }, 15000);
  });
}

// Start HTTP server to serve React build
async function startFrontendServer() {
  return new Promise((resolve, reject) => {
    let buildPath;

    if (isDev) {
      // Development mode
      buildPath = path.join(__dirname, '../frontend/build');
    } else {
      // Production mode - try multiple possible paths
      const possiblePaths = [
        path.join(process.resourcesPath, 'frontend/build'),
        path.join(process.resourcesPath, 'app/frontend/build'),
        path.join(__dirname, '../frontend/build'),
        path.join(process.resourcesPath, 'app.asar.unpacked/frontend/build')
      ];

      buildPath = possiblePaths.find(p => fs.existsSync(p));

      if (!buildPath) {
        console.error('Frontend build not found in any of these paths:');
        possiblePaths.forEach(p => console.error('  -', p));
        reject(new Error('Frontend build directory not found'));
        return;
      }
    }

    console.log('Frontend build path:', buildPath);
    console.log('Build path exists:', fs.existsSync(buildPath));

    // Check if index.html exists
    const indexPath = path.join(buildPath, 'index.html');
    console.log('Index.html path:', indexPath);
    console.log('Index.html exists:', fs.existsSync(indexPath));

    // Create HTTP server
    const server = http.createServer((req, res) => {
      console.log('Request received:', req.url);

      const parsedUrl = url.parse(req.url);
      let pathname = parsedUrl.pathname;

      // Default to index.html for root
      if (pathname === '/') {
        pathname = '/index.html';
      }

      // Handle static files
      const filePath = path.join(buildPath, pathname);
      console.log('Serving file:', filePath);

      // Check if file exists
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          console.log('File not found, serving index.html:', filePath);
          // File doesn't exist, serve index.html for React Router
          const indexPath = path.join(buildPath, 'index.html');
          fs.readFile(indexPath, (err, data) => {
            if (err) {
              console.error('Error reading index.html:', err);
              res.writeHead(404);
              res.end('Not found - index.html missing');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          });
        } else {
          // Serve the file
          fs.readFile(filePath, (err, data) => {
            if (err) {
              console.error('Error reading file:', filePath, err);
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

            console.log('Serving file successfully:', filePath, 'Content-Type:', contentType);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
          });
        }
      });
    });

    // Find free port and start server (try ports 3005-3015)
    findFreePort(3005, (err, freePort) => {
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

// Function to update loading screen
function updateLoadingScreen(message, progress = 0) {
  const loadingHtml = `
    <html>
      <head>
        <style>
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            padding: 50px;
            margin: 0;
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .logo { font-size: 48px; margin-bottom: 30px; font-weight: bold; }
          .message { font-size: 18px; margin-bottom: 20px; }
          .progress-container {
            width: 300px;
            height: 6px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 20px;
          }
          .progress-bar {
            height: 100%;
            background: #4CAF50;
            width: ${progress}%;
            transition: width 0.5s ease;
          }
          .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="logo">Pri Fashion</div>
        <div class="message">${message}</div>
        <div class="progress-container">
          <div class="progress-bar"></div>
        </div>
        <div class="spinner"></div>
        <p style="font-size: 14px; opacity: 0.8;">Please wait, this may take a moment...</p>
      </body>
    </html>
  `;
  mainWindow.loadURL(`data:text/html,${encodeURIComponent(loadingHtml)}`);
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Create main window first
    createWindow();

    // Show initial loading message
    updateLoadingScreen('Initializing Pri Fashion...', 10);

    // Start Django server first
    console.log('Starting Django server...');
    updateLoadingScreen('Starting Django backend server...', 30);
    await startDjangoServer();
    console.log('Django server started');

    // Start frontend server
    console.log('Starting frontend server...');
    updateLoadingScreen('Starting React frontend server...', 60);
    await startFrontendServer();
    console.log('Frontend server started');

    // Load the frontend
    console.log(`Loading frontend from http://127.0.0.1:${frontendPort}`);
    updateLoadingScreen('Loading Pri Fashion interface...', 90);

    // Add a small delay to show the final loading state
    setTimeout(() => {
      mainWindow.loadURL(`http://127.0.0.1:${frontendPort}`);
    }, 1000);

  } catch (error) {
    console.error('Failed to start servers:', error);

    // Show error in the window
    const errorHtml = `
      <html>
        <body style="background:#f44336;font-family:Arial;text-align:center;padding:50px;color:white;">
          <h2>⚠️ Startup Error</h2>
          <p>Failed to start the Pri Fashion application.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p>Please try restarting the application.</p>
          <button onclick="window.close()" style="padding:10px 20px;margin-top:20px;background:white;color:#f44336;border:none;border-radius:5px;cursor:pointer;">Close</button>
        </body>
      </html>
    `;
    mainWindow.loadURL(`data:text/html,${encodeURIComponent(errorHtml)}`);
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
