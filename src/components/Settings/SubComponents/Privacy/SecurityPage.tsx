// src/components/Settings/SubComponents/Privacy/SecurityPage.tsx

import React, { useEffect, useState } from 'react';
import BackButton from './BackButton';

const SecurityPage = () => {
  const [security, setSecurity] = useState({
    firewallEnabled: true,
    smartscreenFilter: true,
    allowInsecureContent: false,
    siteIsolation: true,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.security?.preferences) {
        setSecurity(config.security.preferences);
      }
    };
    fetchConfig();
  }, []);

  const handleToggle = async (key: keyof typeof security) => {
    const updated = { ...security, [key]: !security[key] };
    setSecurity(updated);

    const config = await window.electronAPI.getConfig?.();
    const newConfig = {
      ...config,
      security: {
        ...config.security,
        preferences: updated,
      },
    };

    await window.electronAPI.saveConfig?.(newConfig);
  };

  return (
    <div className="p-6 text-white space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold">Security Settings</h2>
      <p className="text-gray-400">Manage how your browser protects your system and data.</p>

      <div className="space-y-4 mt-4">
        {Object.entries(security).map(([key, val]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={val}
              onChange={() => handleToggle(key as keyof typeof security)}
            />
            <span className="capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default SecurityPage;
