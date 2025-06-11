import React, { useEffect, useState } from 'react';

const options = [
  { key: 'history', label: 'Browsing history' },
  { key: 'downloads', label: 'Download history' },
  { key: 'cookies', label: 'Cookies and other site data' },
  { key: 'cache', label: 'Cached images and files' },
  { key: 'passwords', label: 'Passwords' },
  { key: 'autofill', label: 'Autofill form data' },
];

const ClearOnClosePage = () => {
  const [clearOnClose, setClearOnClose] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.clearOnClose) {
        setClearOnClose(config.clearOnClose);
      } else {
        // Initialize defaults if not present
        const defaultState = Object.fromEntries(options.map(o => [o.key, false]));
        setClearOnClose(defaultState);
      }
    };
    fetchSettings();
  }, []);

  const toggleOption = async (key: string) => {
    const updated = { ...clearOnClose, [key]: !clearOnClose[key] };
    setClearOnClose(updated);
    const config = await window.electronAPI.getConfig?.();
    await window.electronAPI.saveConfig?.({
      ...config,
      clearOnClose: updated,
    });
  };

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Clear on Close</h2>
      <p className="text-gray-400 mb-4">
        Choose what to clear automatically every time you close the browser.
      </p>
      <div className="space-y-3">
        {options.map(option => (
          <div key={option.key} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={!!clearOnClose[option.key]}
              onChange={() => toggleOption(option.key)}
              className="w-5 h-5"
            />
            <label>{option.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClearOnClosePage;
