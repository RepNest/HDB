const { app, BrowserWindow, ipcMain, Menu, session, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

// Proxy and Auth
app.commandLine.appendSwitch('auth-server-whitelist', '*.miamidade.gov,*.sharepoint.com');
app.commandLine.appendSwitch('auth-negotiate-delegate-whitelist', '*.miamidade.gov,*.sharepoint.com');
app.commandLine.appendSwitch('auth-schemes', 'ntlm,negotiate,basic');
app.commandLine.appendSwitch('proxy-auto-detect');
app.commandLine.appendSwitch('enable-features', 'PDFViewerUpdate');

// Config paths
app.setPath('userData', path.join(os.homedir(), 'AppData', 'Roaming', 'HelpDeskBrowser'));
const CONFIG_DIR = path.join(app.getPath('userData'), 'configs');
const USERNAME = os.userInfo().username.toLowerCase();
const USER_CONFIG_PATH = path.join(CONFIG_DIR, `${USERNAME}.json`);
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'src', 'default-config.json');

// Reusable Config Functions
function readConfig() {
  if (!fs.existsSync(USER_CONFIG_PATH)) return {};
  return JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf-8'));
}

function writeConfig(data) {
  fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(data, null, 2));
}

// Initialize User Config
function initializeUserConfig() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const defaultConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));

  if (!fs.existsSync(USER_CONFIG_PATH)) {
    const newConfig = { ...defaultConfig, createdAt: new Date().toISOString() };
    writeConfig(newConfig);
  } else {
    const current = readConfig();
    let changed = false;

    ['apps', 'favorites', 'sidebarCollapsed', 'itdTools', 'history'].forEach(key => {
      if (!(key in current)) {
        current[key] = defaultConfig[key] || (key === 'itdTools' ? {} : key === 'history' ? [] : {});
        changed = true;
      }
    });

    if (!current.createdAt) {
      current.createdAt = new Date().toISOString();
      changed = true;
    }

    if (changed) writeConfig(current);
  }
}

// Create Window
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
      webSecurity: false,
      session: sharedSession,
      partition: 'persist:shared',
      plugins: true,
    },
  });

  win.loadURL(`file://${path.join(__dirname, 'dist/index.html')}`);
}

// Web Contents Events
app.on('web-contents-created', (_event, contents) => {
  contents.on('context-menu', (e, params) => {
    const template = [];
    if (params.linkURL) {
      template.push(
        {
          label: 'Open Link in New Tab',
          click: () => {
            const window = BrowserWindow.getFocusedWindow();
            if (window) {
              window.webContents.send('open-new-tab', params.linkURL);
            }
          },
        },
        {
          label: 'Copy Link Address',
          click: () => require('electron').clipboard.writeText(params.linkURL),
        }
      );
    }

    if (params.srcURL && params.mediaType === 'image') {
      template.push({
        label: 'Save Image As...',
        click: async () => {
          const { dialog } = require('electron');
          const https = require('https');
          const fs = require('fs');
          const path = require('path');

          const win = BrowserWindow.getFocusedWindow();
          if (!win) return;

          const savePath = dialog.showSaveDialogSync(win, {
            defaultPath: path.basename(params.srcURL),
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico'] }],
          });

          if (savePath) {
            https.get(params.srcURL, response => {
              const file = fs.createWriteStream(savePath);
              response.pipe(file);
              file.on('finish', () => file.close());
            }).on('error', err => {
              console.error('❌ Failed to save image:', err.message);
            });
          }
        },
      });
    }

    if (params.selectionText) {
      template.push({
        label: `Search Google for "${params.selectionText.slice(0, 25)}…"`,
        click: () => {
          const q = encodeURIComponent(params.selectionText);
          require('electron').shell.openExternal(`https://www.google.com/search?q=${q}`);
        },
      });
    }

    if (template.length > 0) template.push({ type: 'separator' });

    template.push(
      { role: 'cut', enabled: params.editFlags.canCut },
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'paste', enabled: params.editFlags.canPaste }
    );

    template.push({ type: 'separator' });
    template.push({ role: 'selectAll' });

    template.push({ type: 'separator' });
    template.push({
      label: 'Inspect Element',
      click: () => contents.inspectElement(params.x, params.y),
    });

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: BrowserWindow.fromWebContents(contents) });
  });

  contents.setWindowOpenHandler(({ url }) => {
    const parentSession = contents.session;
    const popup = new BrowserWindow({
      width: 1000,
      height: 800,
      parent: BrowserWindow.fromWebContents(contents),
      modal: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true,
        sandbox: false,
        session: parentSession,
        webSecurity: false,
      },
    });

    popup.loadURL(url);
    return { action: 'deny' };
  });
});

// IPC Handlers
ipcMain.handle('get-user-config', async () => {
  try {
    const config = readConfig();
    return config;
  } catch (err) {
    console.error('❌ Failed to read user config:', err.message);
    return {
      sidebarCollapsed: false,
      apps: [],
      favorites: {},
      itdTools: {},
      history: [],
      createdAt: new Date().toISOString(),
    };
  }
});

ipcMain.handle('save-config', async (_, updatedConfig) => {
  try {
    writeConfig(updatedConfig);
    return true;
  } catch (err) {
    console.error('❌ Failed to save config:', err.message);
    return false;
  }
});

ipcMain.handle('save-favorites', async (_, updatedFavorites) => {
  try {
    if (typeof updatedFavorites !== 'object' || Array.isArray(updatedFavorites)) {
      throw new Error('Favorites must be an object of folders');
    }
    for (const [folder, entries] of Object.entries(updatedFavorites)) {
      if (!Array.isArray(entries)) throw new Error(`Favorites in "${folder}" must be an array`);
      for (const fav of entries) {
        if (!fav?.name || !fav?.url) throw new Error(`Invalid favorite in "${folder}"`);
      }
    }
    const config = readConfig();
    config.favorites = updatedFavorites;
    writeConfig(config);
    return true;
  } catch (err) {
    console.error('❌ Failed to save favorites:', err.message);
    return false;
  }
});

ipcMain.handle('save-history', async (_, newHistory) => {
  try {
    const config = readConfig();
    const flatHistory = [];
    if (Array.isArray(newHistory)) {
      for (const entry of newHistory) {
        if (Array.isArray(entry.url)) {
          for (const subEntry of entry.url) {
            if (typeof subEntry?.url === 'string' && typeof subEntry?.timestamp === 'string') {
              flatHistory.push(subEntry);
            }
          }
        } else if (typeof entry?.url === 'string' && typeof entry?.timestamp === 'string') {
          flatHistory.push(entry);
        }
      }
    }
    config.history = flatHistory;
    writeConfig(config);
  } catch (err) {
    console.error('❌ Failed to save history:', err.message);
  }
});

ipcMain.handle('get-history', async () => {
  try {
    const config = readConfig();
    return config.history || [];
  } catch (err) {
    console.error('❌ Failed to load history:', err.message);
    return [];
  }
});

ipcMain.handle('launch-app', async (_, cmd) => {
  try {
    const match = cmd.match(/^"(.+?)"(.*)$/);
    if (match) {
      spawn(match[1], match[2].trim().split(/\s+/).filter(Boolean), {
        cwd: path.dirname(match[1]),
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }).unref();
    } else {
      spawn('cmd', ['/c', cmd], { shell: true, detached: true, stdio: 'ignore', windowsHide: true }).unref();
    }
  } catch (err) {
    console.error('🚨 Failed to launch app:', err.message);
  }
});

// App lifecycle
let sharedSession;

app.whenReady().then(() => {
  sharedSession = session.fromPartition('persist:shared');
  initializeUserConfig();
  createWindow();

  session.defaultSession.resolveProxy('https://outlook.office.com').then(proxy => {
    console.log('🧭 Proxy settings:', proxy);
  });

  globalShortcut.register('CommandOrControl+T', () => {
    BrowserWindow.getFocusedWindow()?.webContents.send('shortcut:new-tab');
  });
  globalShortcut.register('CommandOrControl+W', () => {
    BrowserWindow.getFocusedWindow()?.webContents.send('shortcut:close-tab');
  });
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    BrowserWindow.getFocusedWindow()?.webContents.send('shortcut:reopen-tab');
  });
  globalShortcut.register('CommandOrControl+D', () => {
    BrowserWindow.getFocusedWindow()?.webContents.send('shortcut:save-favorite');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('login', (event, webContents, request, authInfo, callback) => {
  event.preventDefault();
  if (!authInfo.isProxy && /miamidade\.gov|sharepoint\.com/.test(authInfo.host)) {
    console.log(`🔐 Attempting automatic login to ${authInfo.host}`);
    callback('', '');
  } else {
    console.warn('🔐 Unknown domain requested credentials:', authInfo.host);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});