const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');

const username = os.userInfo().username;
const baseDir = path.join(process.env.APPDATA || '', 'HelpDeskBrowser');
const configPath = path.join(baseDir, 'configs', `${username}.json`);
const defaultPath = path.join(baseDir, 'default-config.json');

let config = {
  sidebarCollapsed: false,
  favorites: [],
  apps: [],
  createdAt: new Date().toISOString()
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
  console.warn('Failed to load or create config:', err.message);
}

contextBridge.exposeInMainWorld('electronAPI', {
  launchApp: (cmd) => ipcRenderer.invoke('launch-app', cmd),
  getConfig: () => ipcRenderer.invoke('get-user-config'), // ✅ always fresh
  showContextMenu: () => ipcRenderer.invoke('show-context-menu'),
  ipc: {
    on: (channel, fn) => ipcRenderer.on(channel, (_, ...args) => fn(...args)),
    off: (channel, fn) => ipcRenderer.removeListener(channel, fn)
  },
  saveFavorite: (fav) => ipcRenderer.invoke('save-favorite', fav) // ✅ new
});
