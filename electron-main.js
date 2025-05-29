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
    const template = [];

    // 🌐 Open link in new tab
    if (params.linkURL) {
      template.push({
        label: 'Open Link in New Tab',
        click: () => {
          contents.send('open-new-tab', params.linkURL);
        }
      });
      template.push({
        label: 'Copy Link Address',
        click: () => {
          require('electron').clipboard.writeText(params.linkURL);
        }
      });
    }

    // 🖼️ Save image
    if (params.srcURL && params.mediaType === 'image') {
      template.push({
        label: 'Save Image As...',
        click: () => {
          require('electron').shell.openExternal(params.srcURL);
        }
      });
    }

    // 🔍 Search selected text
    if (params.selectionText) {
      template.push({
        label: `Search Google for "${params.selectionText.slice(0, 25)}…"`,
        click: () => {
          const q = encodeURIComponent(params.selectionText);
          require('electron').shell.openExternal(`https://www.google.com/search?q=${q}`);
        }
      });
    }

    if (template.length > 0) {
      template.push({ type: 'separator' });
    }

    // ✂️ Standard editing options
    template.push(
      { role: 'cut', enabled: params.editFlags.canCut },
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'paste', enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { role: 'selectAll' },
      { type: 'separator' },
      { label: 'Reload', click: () => contents.reload() }
    );

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: BrowserWindow.fromWebContents(contents) });
  });

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
    return { action: 'deny' };
  });
});

// ✅ IPC handlers
ipcMain.handle('get-user-config', async () => {
  const data = fs.readFileSync(USER_CONFIG_PATH, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('launch-app', async (_, cmd) => {
  exec(cmd);
});

ipcMain.handle('save-favorite', async (_, newFavorite) => {
  try {
    const config = JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf-8'));
    config.favorites = [...(config.favorites || []), newFavorite];
    fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to save favorite:', err);
    return false;
  }
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
  