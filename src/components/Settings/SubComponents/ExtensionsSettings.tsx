import React, { useEffect, useState } from 'react';

type Extension = {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
};

declare global {
  interface Window {
    electronAPI: {
      saveFavorites(updated: { [folder: string]: { name: string; url: string; favicon?: string; }[]; }): unknown;
      launchApp(cmd: string): unknown;
      saveHistory(arg0: never[]): unknown;
      getConfig: () => Promise<any>;
      saveConfig: (config: any) => Promise<void>;
    };
  }
}

export default function ExtensionsSettings() {
  const [extensions, setExtensions] = useState<Extension[]>([]);

  useEffect(() => {
    window.electronAPI.getConfig().then(config => {
      const ext = config?.extensions || [];
      setExtensions(ext);
    });
  }, []);

  const updateExtension = async (id: string, changes: Partial<Extension>) => {
    const updated = extensions.map(ext =>
      ext.id === id ? { ...ext, ...changes } : ext
    );
    setExtensions(updated);
    const config = await window.electronAPI.getConfig();
    config.extensions = updated;
    await window.electronAPI.saveConfig(config);
  };

  const removeExtension = async (id: string) => {
    const updated = extensions.filter(ext => ext.id !== id);
    setExtensions(updated);
    const config = await window.electronAPI.getConfig();
    config.extensions = updated;
    await window.electronAPI.saveConfig(config);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Installed Extensions</h2>
      {extensions.length === 0 ? (
        <p className="text-gray-400">No extensions installed.</p>
      ) : (
        <ul className="space-y-4">
          {extensions.map(ext => (
            <li key={ext.id} className="bg-neutral-800 p-4 rounded shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{ext.name}</h3>
                  <p className="text-sm text-gray-400">{ext.description}</p>
                  <p className="text-xs text-gray-500">v{ext.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateExtension(ext.id, { enabled: !ext.enabled })}
                    className={`px-3 py-1 rounded text-sm ${ext.enabled ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                  >
                    {ext.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => removeExtension(ext.id)}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}