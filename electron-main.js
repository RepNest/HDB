const { app, BrowserWindow, ipcMain, Menu, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

// Proxy + Auth settings
app.commandLine.appendSwitch('auth-server-whitelist', '*.miamidade.gov,*.sharepoint.com');
app.commandLine.appendSwitch('auth-negotiate-delegate-whitelist', '*.miamidade.gov,*.sharepoint.com');
app.commandLine.appendSwitch('auth-schemes', 'ntlm,negotiate,basic');
app.commandLine.appendSwitch('proxy-auto-detect');
app.commandLine.appendSwitch('enable-features', 'AllowInsecurePrivateNetworkRequests');

// Set custom userData directory
app.setPath('userData', path.join(os.homedir(), 'AppData', 'Roaming', 'HelpDeskBrowser'));

// Config paths
const CONFIG_DIR = path.join(app.getPath('userData'), 'configs');
const USERNAME = os.userInfo().username.toLowerCase();
const USER_CONFIG_PATH = path.join(CONFIG_DIR, `${USERNAME}.json`);
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'src', 'default-config.json');

let userConfig = {};

function initializeUserConfig() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });

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
      partition: 'persist:shared' // all windows share this partition/session
    }
  });

  win.loadFile('dist/index.html');
}

app.on('web-contents-created', (event, contents) => {
  contents.on('context-menu', (e, params) => {
    const template = [];

    if (params.linkURL) {
      template.push(
        {
          label: 'Open Link in New Tab',
          click: () => contents.send('open-new-tab', params.linkURL)
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
        click: () => require('electron').shell.openExternal(params.srcURL)
      });
    }

    if (params.selectionText) {
      template.push({
        label: `Search Google for "${params.selectionText.slice(0, 25)}…"`,
        click: () => {
          const q = encodeURIComponent(params.selectionText);
          require('electron').shell.openExternal(`https://www.google.com/search?q=${q}`);
        }
      });
    }

    if (template.length > 0) template.push({ type: 'separator' });

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
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true,
        sandbox: false,
        partition: 'persist:shared' // ⬅ retains auth/session
      }
    });

    popup.loadURL(url);
    return { action: 'deny' };
  });
});

// IPC handlers
ipcMain.handle('get-user-config', async () => {
  const data = fs.readFileSync(USER_CONFIG_PATH, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('launch-app', async (_, cmd) => {
  exec(cmd);
});

ipcMain.handle('save-favorites', async (_, updatedFavorites) => {
  try {
    const config = JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf-8'));
    config.favorites = updatedFavorites;
    fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to save favorites:', err);
    return false;
  }
});

// Proxy resolution test
app.whenReady().then(() => {
  session.defaultSession.resolveProxy('https://outlook.office.com').then(proxy => {
    console.log('🧭 Proxy settings:', proxy);
  });
});

// Auto-login for trusted domains (WIA)
app.on('login', (event, webContents, request, authInfo, callback) => {
  event.preventDefault();
  if (authInfo.isProxy === false && /miamidade\.gov|sharepoint\.com/.test(authInfo.host)) {
    console.log(`🔐 Attempting automatic login to ${authInfo.host}`);
    callback('', '');
  } else {
    console.warn('🔐 Untrusted domain requested credentials:', authInfo.host);
  }
});

// Lifecycle
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
