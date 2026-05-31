const { app, BrowserWindow } = require('electron');
const path = require('path');

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = '13028'; // Use a distinct port for desktop client to avoid conflicts with 3000

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

  // Start the background Express server
  try {
    console.log("Starting backend Express server...");
    require(path.join(__dirname, 'dist', 'server.cjs'));
  } catch (error) {
    console.error("Failed to start server.cjs:", error);
  }

  // Load the web app which is hosted by the Express server on port 13028
  // Give Express a split second to boot
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:13028').catch((err) => {
      console.warn("Retrying link connection...", err);
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:13028').catch((e) => {
          console.error("Local web server failed to respond:", e);
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

  app.whenReady().then(createWindow);

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
