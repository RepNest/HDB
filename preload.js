console.log('[preload] Loaded preload.js');
const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const username = os.userInfo().username;
const baseDir = path.join(process.env.APPDATA || '', 'HelpDeskBrowser');
const configPath = path.join(baseDir, 'configs', `${username}.json`);
const defaultPath = path.join(baseDir, 'default-config.json');
const secureCfgPath = path.join(baseDir, 'secure-config.json');
const securePath = path.join(baseDir, 'secure-storage.json');

let config = {
  sidebarCollapsed: false,
  favorites: {},
  apps: [],
  createdAt: new Date().toISOString(),
  history: []
};

// Load or create main config
try {
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    if (fs.existsSync(defaultPath)) {
      const rawDefault = fs.readFileSync(defaultPath, 'utf-8');
      config = JSON.parse(rawDefault);
    }
    config.createdAt = new Date().toISOString();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } else {
    const raw = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(raw);
  }
} catch (err) {
  console.warn('⚠ Failed to load or create config:', err.message);
}

// 🔐 Secure config auto-generation
if (!fs.existsSync(secureCfgPath)) {
  const key = crypto.randomBytes(32); // AES-256
  const iv = crypto.randomBytes(16);  // 128-bit IV
  const secureData = {
    encryption: {
      aesKey: key.toString('base64'),
      iv: iv.toString('base64')
    }
  };
  fs.writeFileSync(secureCfgPath, JSON.stringify(secureData, null, 2));
}

// Load encryption keys
const { key, iv } = (() => {
  const raw = fs.readFileSync(secureCfgPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return {
    key: Buffer.from(parsed.encryption.aesKey, 'base64'),
    iv: Buffer.from(parsed.encryption.iv, 'base64')
  };
})();

// Encryption helpers
function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(text) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(text, 'base64', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

function loadSecureStore() {
  if (fs.existsSync(securePath)) {
    return JSON.parse(fs.readFileSync(securePath, 'utf-8'));
  }
  return {};
}

function saveSecureStore(data) {
  fs.writeFileSync(securePath, JSON.stringify(data, null, 2));
}

// Expose secure + config APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  launchApp: (cmd) => ipcRenderer.invoke('launch-app', cmd),
  getConfig: () => ipcRenderer.invoke('get-user-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  saveFavorites: (favorites) => ipcRenderer.invoke('save-favorites', favorites),
  saveHistory: (history) => ipcRenderer.invoke('save-history', history),
  getHistory: () => ipcRenderer.invoke('get-history'),

  // Encrypted credentials
  loadEncryptedData: async (keyName) => {
    const store = loadSecureStore();
    if (!store[keyName]) return [];
    try {
      const decrypted = decrypt(store[keyName]);
      return JSON.parse(decrypted);
    } catch (err) {
      console.error(`Failed to decrypt ${keyName}:`, err.message);
      return [];
    }
  },
  saveEncryptedData: async (keyName, value) => {
    const encrypted = encrypt(JSON.stringify(value));
    const store = loadSecureStore();
    store[keyName] = encrypted;
    saveSecureStore(store);
  },

  ipc: {
    on: (channel, fn) => ipcRenderer.on(channel, (_, ...args) => fn(...args)),
    off: (channel, fn) => ipcRenderer.removeListener(channel, fn)
  },

  onNewTab: (callback) => ipcRenderer.on('open-new-tab', (_, url) => callback(url)),
});

// Relay shortcut events
ipcRenderer.on('shortcut:new-tab', () => window.dispatchEvent(new CustomEvent('shortcut:new-tab')));
ipcRenderer.on('shortcut:close-tab', () => window.dispatchEvent(new CustomEvent('shortcut:close-tab')));
ipcRenderer.on('shortcut:reopen-tab', () => window.dispatchEvent(new CustomEvent('shortcut:reopen-tab')));
ipcRenderer.on('shortcut:save-favorite', () => window.dispatchEvent(new CustomEvent('shortcut:save-favorite')));

// Relay tab opening event
ipcRenderer.on('open-new-tab', (_, url) => {
  console.log('[preload] Dispatching open-tab:', url);
  window.dispatchEvent(new CustomEvent('open-tab', { detail: { url } }));
});

// Intercept window.open → open as tab
window.open = function (url, frameName, features) {
  console.log('[preload] Intercepted window.open → opening as tab:', url);
  window.dispatchEvent(new CustomEvent('open-tab', { detail: { url } }));
  return null;
};
