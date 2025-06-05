import React, { useEffect, useState } from 'react';

export default function SettingsTab() {
  const [homepage, setHomepage] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    (async () => {
      const config = await window.electronAPI.getConfig();
      setHomepage(config.homepage || '');
      setSidebarCollapsed(config.sidebarCollapsed || false);
    })();
  }, []);

  const saveSettings = async () => {
    const config = await window.electronAPI.getConfig();
    config.homepage = homepage;
    config.sidebarCollapsed = sidebarCollapsed;
    await window.electronAPI.writeUserConfig(config);
    alert('Settings saved');
  };

  const exportConfig = async () => {
    const config = await window.electronAPI.getConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HelpDeskBrowser-config.json';
    a.click();
  };

  const importConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    await window.electronAPI.writeUserConfig(parsed);
    alert('Config imported. Please restart the app.');
  };

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl mb-4 font-semibold">Settings</h2>

      <div className="mb-3">
        <label className="block text-sm mb-1">Homepage URL</label>
        <input
          className="w-full p-2 text-black rounded"
          value={homepage}
          onChange={e => setHomepage(e.target.value)}
          placeholder="e.g., https://miamidadecounty.sharepoint.com/sites/ITServiceDesk"
        />
      </div>

      <div className="mb-3">
        <label>
          <input
            type="checkbox"
            checked={sidebarCollapsed}
            onChange={() => setSidebarCollapsed(prev => !prev)}
            className="mr-2"
          />
          Collapse Sidebar by Default
        </label>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="px-4 py-2 bg-blue-600 rounded" onClick={saveSettings}>Save</button>
        <button className="px-4 py-2 bg-green-600 rounded" onClick={exportConfig}>Export</button>
        <label className="px-4 py-2 bg-yellow-600 rounded cursor-pointer">
          Import
          <input type="file" accept=".json" className="hidden" onChange={importConfig} />
        </label>
      </div>
    </div>
  );
}
