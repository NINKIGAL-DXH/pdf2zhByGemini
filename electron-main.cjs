const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = '0'; // Use 0 to let OS assign a random free port
process.env.HOST = '127.0.0.1'; // Bind strictly to localhost // Use a distinct port for desktop client to avoid conflicts with 3000

// Provide the system-approved user data directory for the server to avoid writing to $HOME directly

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "PDF2ZH Translation GUI",
    autoHideMenuBar: true,
  });

  // Register developer shortcut helpers (Reload and Toggle Developer Tools)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isControlOrMeta = input.control || input.meta;
    const key = input.key.toLowerCase();
    
    // CommandOrControl + R or F5 to reload
    if ((isControlOrMeta && key === 'r') || input.key === 'F5') {
      mainWindow.reload();
      event.preventDefault();
    }
    // CommandOrControl + Option + I or Control + Shift + I or F12 to toggle DevTools
    if ((isControlOrMeta && input.alt && key === 'i') || (isControlOrMeta && input.shift && key === 'i') || input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Start the background Express server
  try {
    console.log("Starting backend Express server...");
    require(path.join(__dirname, 'dist', 'server.cjs'));
  } catch (error) {
    console.error("Failed to start server.cjs:", error);
    dialog.showErrorBox(
      "Backend Server Error",
      "Failed to start the background translation service:\n\n" + (error.stack || error)
    );
  }

  // Load the web app which is hosted by the Express server on port " + actualPort + "
  // Give Express a split second to boot
  setTimeout(() => {
    let actualPort = global.APP_PORT || 13028;
    mainWindow.loadURL('http://127.0.0.1:' + actualPort).catch((err) => {
      console.warn("Retrying link connection (attempt 2)...", err);
      setTimeout(() => {
        actualPort = global.APP_PORT || 13028; // Re-evaluate in case server took longer than 1s to set it
        mainWindow.loadURL('http://127.0.0.1:' + actualPort).catch((e) => {
          console.error("Local web server failed to respond:", e);
          dialog.showErrorBox(
            "Connection Port Error",
            "The desktop interface could not connect to the local translation service on port " + actualPort + ".\n\n" +
            "Please confirm no other application is using this port, or retry launching the application.\n\nError details: " + e.message
          );
        });
      }, 1500);
    });
  }, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    process.env.APP_DATA_DIR = app.getPath('userData');
    createWindow();
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
}
