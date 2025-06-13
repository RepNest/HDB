const { ipcMain, session } = require('electron');

ipcMain.handle('clear-cookies', async (event, url) => {
  try {
    const ses = session.defaultSession;
    const cookies = await ses.cookies.get({ domain: new URL(url).hostname });
    for (const cookie of cookies) {
      await ses.cookies.remove(url, cookie.name);
    }
    console.log(`Cookies cleared for ${url} at ${new Date().toISOString()}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to clear cookies for ${url} at ${new Date().toISOString()}:`, err);
    return { success: false, error: err.message };
  }
});

ipcMain.on('webview-ready', (event, tabId, url) => {
  if (url.startsWith('https://informs.miamidade.gov/')) {
    console.log(`INFORMS page loaded for tab ${tabId} at ${new Date().toISOString()}: ${url}`);
    event.sender.send(`landing-page-ready-${tabId}`);
  } else {
    console.log(`Non-INFORMS page loaded for tab ${tabId} at ${new Date().toISOString()}: ${url}`);
  }
});

console.log('background.js loaded at', new Date().toISOString());