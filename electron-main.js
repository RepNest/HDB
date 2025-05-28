const { app, BrowserWindow, ipcMain, Menu, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

const CONFIG_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'helpdeskbrowser', 'configs');
const USERNAME = os.userInfo().username.toLowerCase();
const USER_CONFIG_PATH = path.join(CONFIG_DIR, `${USERNAME}.json`);
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'src', 'default-config.json');

let userConfig = {};

function initializeUserConfig() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const defaultConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));

  if (!fs.existsSync(USER_CONFIG_PATH)) {
    userConfig = { ...defaultConfig, createdAt: new Date().toISOString() };
    fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(userConfig, null, 2));
  } else {
    userConfig = JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf-8'));
    let changed = false;

    ['apps', 'favorites', 'sidebarCollapsed'].forEach(key => {
      if (!(key in userConfig)) {
        userConfig[key] = defaultConfig[key];
        changed = true;
      }
    });

    if (!userConfig.createdAt) {
      userConfig.createdAt = new Date().toISOString();
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(userConfig, null, 2));
    }
  }
}

// Create the main browser window
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
      webSecurity: false
    }
  });

  win.loadFile('dist/index.html');
}
  
// Handle context menu in webviews
app.on('web-contents-created', (event, contents) => {
  contents.on('context-menu', (e, params) => {
    const menu = Menu.buildFromTemplate([
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'paste', enabled: params.editFlags.canPaste },
      { role: 'cut', enabled: params.editFlags.canCut },
      { type: 'separator' },
      { role: 'selectAll' },
      { type: 'separator' },
      { label: 'Reload', click: () => contents.reload() }
    ]);

    menu.popup({ window: BrowserWindow.fromWebContents(contents) });
  });

   // Support for popups
    contents.setWindowOpenHandler(({ url }) => {
      const popup = new BrowserWindow({
        width: 800,
        height: 600,
        parent: BrowserWindow.fromWebContents(contents),
        webPreferences: {
          webviewTag: true,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'),
          sandbox: false
        }
      });
      popup.loadURL(url);
      return { action: 'deny' }; // Prevent default, handled manually
    });
  });
  
  // IPC handlers
  ipcMain.handle('get-user-config', async () => userConfig);
  ipcMain.handle('launch-app', async (_, cmd) => {
    exec(cmd);
  });
  
  // App lifecycle
  app.whenReady().then(() => {
    initializeUserConfig();
    createWindow();
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
  