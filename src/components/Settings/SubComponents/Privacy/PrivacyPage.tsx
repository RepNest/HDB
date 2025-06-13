// src/components/Settings/SubComponents/Privacy/PrivacyPage.tsx

import React, { useEffect, useState } from 'react';
import BackButton from './BackButton';

const PrivacyPage = () => {
  const [settings, setSettings] = useState({
    sendDoNotTrack: false,
    allowCookies: true,
    blockThirdPartyCookies: false,
    enableSafeBrowsing: true,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.privacy?.preferences) {
        setSettings(config.privacy.preferences);
      }
    };
    fetchConfig();
  }, []);

  const handleToggle = async (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);

    const config = await window.electronAPI.getConfig?.();
    const newConfig = {
      ...config,
      privacy: {
        ...config.privacy,
        preferences: updated,
      },
    };

    await window.electronAPI.saveConfig?.(newConfig);
  };

  return (
    <div className="p-6 text-white space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold">Privacy Preferences</h2>
      <p className="text-gray-400">Control how your browser handles privacy-related settings.</p>

      <div className="space-y-4 mt-4">
        {Object.entries(settings).map(([key, val]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={val}
              onChange={() => handleToggle(key as keyof typeof settings)}
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

export default PrivacyPage;
