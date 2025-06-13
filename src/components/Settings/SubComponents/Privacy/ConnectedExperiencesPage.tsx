// src/components/Settings/SubComponents/Privacy/ConnectedExperiencesPage.tsx

import React, { useEffect, useState } from 'react';
import BackButton from './BackButton';

const ConnectedExperiencesPage = () => {
  const [settings, setSettings] = useState({
    searchSuggestions: true,
    personalizeAds: false,
    useLocation: true,
    shareUsageData: false,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.connectedExperiences?.preferences) {
        setSettings(config.connectedExperiences.preferences);
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
      connectedExperiences: {
        ...config.connectedExperiences,
        preferences: updated,
      },
    };

    await window.electronAPI.saveConfig?.(newConfig);
  };

  return (
    <div className="p-6 text-white space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold">Search and Connected Experiences</h2>
      <p className="text-gray-400">
        Manage how your browser uses connected services like search, location, and usage data.
      </p>

      <div className="space-y-4 mt-4">
        {Object.entries(settings).map(([key, val]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={val}
              onChange={() => handleToggle(key as keyof typeof settings)}
            />
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ConnectedExperiencesPage;
