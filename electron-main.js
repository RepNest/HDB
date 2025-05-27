const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ---- Configuration Bootstrapping ----
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

    // Patch missing keys
    ['apps', 'favorites', 'sidebarCollapsed'].forEach(key => {
      const isMissing = !(key in userConfig);
      const isEmptyArray = Array.isArray(userConfig[key]) && userConfig[key].length === 0;
      if (isMissing || isEmptyArray) {
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

// ---- Create Electron Window ----
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

// ---- IPC Handler for Frontend Access ----
ipcMain.handle('get-user-config', async () => userConfig);
ipcMain.handle('launch-app', async (_, cmd) => {
  const exec = require('child_process').exec;
  exec(cmd);
});

// ---- App Lifecycle ----
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
