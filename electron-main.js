const { app, BrowserWindow, ipcMain, Menu, session, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

// Proxy and Auth setup
app.commandLine.appendSwitch('auth-server-whitelist', '*.miamidade.gov,*.sharepoint.com');
app.commandLine.appendSwitch('auth-negotiate-delegate-whitelist', '*.miamidade.gov,*.sharepoint.com');
app.commandLine.appendSwitch('auth-schemes', 'ntlm,negotiate,basic');
app.commandLine.appendSwitch('proxy-auto-detect');
app.commandLine.appendSwitch('enable-features', 'PDFViewerUpdate');

// Set custom user data path
app.setPath('userData', path.join(os.homedir(), 'AppData', 'Roaming', 'HelpDeskBrowser'));
const USERNAME = os.userInfo().username.toLowerCase();
const CONFIG_DIR = path.join(app.getPath('userData'), 'configs');
const SECURE_KEY_PATH = path.join(CONFIG_DIR, `secure-config-${USERNAME}.json`);
const SECURE_STORE = path.join(app.getPath('userData'), 'secure-storage.json');
const USER_CONFIG_PATH = path.join(CONFIG_DIR, `${USERNAME}.json`);
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'src', 'default-config.json');

// Auto-generate per-user secure-config.json
if (!fs.existsSync(SECURE_KEY_PATH)) {
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const secureData = {
    encryption: {
      aesKey: aesKey.toString('base64'),
      iv: iv.toString('base64')
    }
  };
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(SECURE_KEY_PATH, JSON.stringify(secureData, null, 2));
}

// Encryption helpers
function loadEncryptionKeys() {
  const { encryption } = JSON.parse(fs.readFileSync(SECURE_KEY_PATH, 'utf-8'));
  return {
    key: Buffer.from(encryption.aesKey, 'base64'),
    iv: Buffer.from(encryption.iv, 'base64')
  };
}

function encrypt(text) {
  const { key, iv } = loadEncryptionKeys();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(encryptedText) {
  const { key, iv } = loadEncryptionKeys();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function loadSecureStore() {
  if (!fs.existsSync(SECURE_STORE)) return {};
  return JSON.parse(fs.readFileSync(SECURE_STORE, 'utf-8'));
}

function saveSecureStore(store) {
  fs.writeFileSync(SECURE_STORE, JSON.stringify(store, null, 2));
}

// Config helpers
function readConfig() {
  if (!fs.existsSync(USER_CONFIG_PATH)) return {};
  return JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf-8'));
}

function writeConfig(data) {
  fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(data, null, 2));
}

function initializeUserConfig() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const defaultConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));

  if (!fs.existsSync(USER_CONFIG_PATH)) {
    const newConfig = { ...defaultConfig, createdAt: new Date().toISOString() };
    writeConfig(newConfig);
  } else {
    const current = readConfig();
    let changed = false;
    ['apps', 'favorites', 'sidebarCollapsed'].forEach(key => {
      if (!(key in current)) {
        current[key] = defaultConfig[key];
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

function loadExtensions() {
  const extDir = path.join(app.getPath('userData'), 'extensions');
  if (!fs.existsSync(extDir)) return;
  fs.readdirSync(extDir).forEach(file => {
    const extPath = path.join(extDir, file);
    if (file.endsWith('.js')) {
      try {
        require(extPath);
        console.log(`✅ Loaded extension: ${file}`);
      } catch (err) {
        console.error(`❌ Failed to load extension ${file}:`, err);
      }
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
      webSecurity: false,
      session: sharedSession,
      partition: 'persist:shared',
      plugins: true
    }
  });

  win.loadURL(`file://${path.join(__dirname, 'dist/index.html')}`);
}

// Context menu and popup handler
app.on('web-contents-created', (_event, contents) => {
  contents.on('context-menu', (e, params) => {
    const template = [];

    if (params.linkURL) {
      template.push(
        {
          label: 'Open Link in New Tab',
          click: () => BrowserWindow.getFocusedWindow()?.webContents.send('open-new-tab', params.linkURL)
        },
        {
          label: 'Copy Link Address',
          click: () => require('electron').clipboard.writeText(params.linkURL)
        }
      );
    }

    if (params.srcURL && params.mediaType === 'image') {
      template.push({
        label: 'Save Image As...',
        click: async () => {
          const { dialog } = require('electron');
          const https = require('https');
          const savePath = dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
            defaultPath: path.basename(params.srcURL),
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
          });
          if (savePath) {
            https.get(params.srcURL, res => {
              const file = fs.createWriteStream(savePath);
              res.pipe(file);
              file.on('finish', () => file.close());
            });
          }
        }
      });
    }

    if (params.selectionText) {
      template.push({
        label: `Search Google for "${params.selectionText.slice(0, 25)}…"`,
        click: () => require('electron').shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`)
      });
    }

    if (template.length) template.push({ type: 'separator' });

    template.push(
      { role: 'cut', enabled: params.editFlags.canCut },
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'paste', enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { role: 'selectAll' },
      { type: 'separator' },
      {
        label: 'Inspect Element',
        click: () => contents.inspectElement(params.x, params.y)
      }
    );

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: BrowserWindow.fromWebContents(contents) });
  });

  contents.setWindowOpenHandler(({ url }) => {
    const popup = new BrowserWindow({
      width: 1000,
      height: 800,
      parent: BrowserWindow.fromWebContents(contents),
      webPreferences: {
        preload: path.resolve(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true,
        sandbox: false,
        session: contents.session,
        webSecurity: false
      }
    });
    popup.loadURL(url);
    return { action: 'deny' };
  });
});

// IPC handlers
ipcMain.handle('get-user-config', () => {
  try {
    const config = readConfig();
    if (Array.isArray(config.favorites)) config.favorites = { Unsorted: config.favorites };
    if (!Array.isArray(config.history)) config.history = [];
    return config;
  } catch {
    return { sidebarCollapsed: false, apps: [], favorites: {}, history: [], createdAt: new Date().toISOString() };
  }
});

ipcMain.handle('save-config', (_, updatedConfig) => {
  try {
    writeConfig(updatedConfig);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('save-favorites', (_, favorites) => {
  try {
    const config = readConfig();
    config.favorites = favorites;
    writeConfig(config);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('save-history', (_, history) => {
  try {
    const config = readConfig();
    config.history = history;
    writeConfig(config);
  } catch (err) {
    console.error('Failed to save history:', err.message);
  }
});

ipcMain.handle('get-history', () => {
  try {
    const config = readConfig();
    return config.history || [];
  } catch {
    return [];
  }
});

ipcMain.handle('save-encrypted', (_, keyName, value) => {
  const store = loadSecureStore();
  store[keyName] = encrypt(JSON.stringify(value));
  saveSecureStore(store);
});

ipcMain.handle('load-encrypted', (_, keyName) => {
  const store = loadSecureStore();
  if (!store[keyName]) return [];
  try {
    return JSON.parse(decrypt(store[keyName]));
  } catch (err) {
    console.warn(`Failed to decrypt ${keyName}:`, err.message);
    return [];
  }
});

ipcMain.handle('launch-app', (_, cmd) => {
  try {
    const match = cmd.match(/^"(.+?)"(.*)$/);
    if (match) {
      spawn(match[1], match[2].trim().split(/\s+/), {
        cwd: path.dirname(match[1]),
        detached: true,
        stdio: 'ignore'
      }).unref();
    } else {
      spawn('cmd', ['/c', cmd], {
        shell: true,
        detached: true,
        stdio: 'ignore'
      }).unref();
    }
  } catch (err) {
    console.error('Failed to launch app:', err.message);
  }
});

// App lifecycle
let sharedSession;

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
  sharedSession = session.fromPartition('persist:shared');
  initializeUserConfig();
  loadExtensions();
  createWindow();

  globalShortcut.register('CommandOrControl+T', () =>
    BrowserWindow.getFocusedWindow()?.webContents.send('shortcut:new-tab')
  );
  globalShortcut.register('CommandOrControl+W', () =>
    BrowserWindow.getFocusedWindow()?.webContents.send('shortcut:close-tab')
  );
  globalShortcut.register('CommandOrControl+Shift+T', () =>
    BrowserWindow.getFocusedWindow()?.webContents.send('shortcut:reopen-tab')
  );
  globalShortcut.register('CommandOrControl+D', () =>
    BrowserWindow.getFocusedWindow()?.webContents.send('shortcut:save-favorite')
  );

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('login', (event, webContents, request, authInfo, callback) => {
  event.preventDefault();
  if (!authInfo.isProxy && /miamidade\.gov|sharepoint\.com/.test(authInfo.host)) {
    console.log(`Auto login: ${authInfo.host}`);
    callback('', '');
  } else {
    console.warn('Untrusted domain requested credentials:', authInfo.host);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
