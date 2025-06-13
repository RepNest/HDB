// src/components/Settings/SubComponents/Privacy/ClearOnClosePage.tsx

import React, { useEffect, useState } from 'react';
import BackButton from './BackButton';

type ClearDataOptions = {
  history: boolean;
  cookies: boolean;
  cache: boolean;
  passwords: boolean;
  autofill: boolean;
  sitePermissions: boolean;
};

const ClearOnClosePage = () => {
  const [clearOptions, setClearOptions] = useState<ClearDataOptions>({
    history: false,
    cookies: false,
    cache: false,
    passwords: false,
    autofill: false,
    sitePermissions: false,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.clearOnClose) {
        setClearOptions(config.clearOnClose);
      }
    };
    fetchConfig();
  }, []);

  const toggleOption = async (key: keyof ClearDataOptions) => {
    const updated = { ...clearOptions, [key]: !clearOptions[key] };
    setClearOptions(updated);

    const config = await window.electronAPI.getConfig?.();
    const newConfig = { ...config, clearOnClose: updated };
    await window.electronAPI.saveConfig?.(newConfig);
  };

  return (
    <div className="p-6 text-white space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold">Clear Browsing Data on Close</h2>
      <p className="text-sm text-gray-400 mb-4">
        Select what you want to automatically clear every time you close the browser.
      </p>

      <div className="space-y-3">
        {Object.entries(clearOptions).map(([key, value]) => (
          <label key={key} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={value}
              onChange={() => toggleOption(key as keyof ClearDataOptions)}
              className="w-4 h-4"
            />
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ClearOnClosePage;
