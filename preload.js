const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Optional fallback config logic for hardening preload access
const username = os.userInfo().username;
const baseDir = path.join(process.env.APPDATA || '', 'HelpDeskBrowser');
const configPath = path.join(baseDir, 'configs', `${username}.json`);
const defaultPath = path.join(baseDir, 'default-config.json');

let config = {
  sidebarCollapsed: false,
  favorites: {},
  apps: [],
  createdAt: new Date().toISOString(),
  history: []
};

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

contextBridge.exposeInMainWorld('electronAPI', {
  launchApp: (cmd) => ipcRenderer.invoke('launch-app', cmd),
  getConfig: () => ipcRenderer.invoke('get-user-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  saveFavorites: (favorites) => {
    if (typeof favorites === 'object' && !Array.isArray(favorites)) {
      for (const folder in favorites) {
        if (!Array.isArray(favorites[folder])) {
          console.warn(`Folder "${folder}" must be an array of favorites`);
          return;
        }
        for (const fav of favorites[folder]) {
          if (!fav.name || !fav.url) {
            console.warn(`Invalid favorite in folder "${folder}":`, fav);
            return;
          }
        }
      }
    } else {
      console.warn('Favorites must be an object of folders');
      return;
    }

    return ipcRenderer.invoke('save-favorites', favorites);
  },
  saveHistory: (url) => ipcRenderer.invoke('save-history', url),
  getHistory: () => ipcRenderer.invoke('get-history'),
  ipc: {
    on: (channel, fn) => ipcRenderer.on(channel, (_, ...args) => fn(...args)),
    off: (channel, fn) => ipcRenderer.removeListener(channel, fn)
  },
  onNewTab: (callback) => ipcRenderer.on('open-new-tab', (_, url) => callback(url))
});

// Relay keyboard shortcut events
ipcRenderer.on('shortcut:new-tab', () => {
  window.dispatchEvent(new CustomEvent('shortcut:new-tab'));
});

ipcRenderer.on('shortcut:close-tab', () => {
  window.dispatchEvent(new CustomEvent('shortcut:close-tab'));
});

ipcRenderer.on('shortcut:reopen-tab', () => {
  window.dispatchEvent(new CustomEvent('shortcut:reopen-tab'));
});

ipcRenderer.on('shortcut:save-favorite', () => {
  window.dispatchEvent(new CustomEvent('shortcut:save-favorite'));
});

// Relay window.open() requests as custom DOM events
ipcRenderer.on('open-new-tab', (_, url) => {
  console.log('[preload] Dispatching open-tab:', url);
  window.dispatchEvent(new CustomEvent('open-tab', { detail: { url } }));
});

// Force all window.open calls to trigger tab creation instead of opening a new window
window.open = function (url, frameName, features) {
  console.log('[preload] Intercepted window.open → opening as tab:', url);
  window.dispatchEvent(new CustomEvent('open-tab', { detail: { url } }));
  return null; // Simulates blocked popup
};