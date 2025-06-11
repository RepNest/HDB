import React, { useEffect, useState } from 'react';

type PrivacySettingsState = {
  sendDoNotTrack: boolean;
  blockThirdPartyCookies: boolean;
  prefetchDns: boolean;
};

const PrivacyPage = () => {
  const [settings, setSettings] = useState<PrivacySettingsState>({
    sendDoNotTrack: false,
    blockThirdPartyCookies: true,
    prefetchDns: true
  });

  useEffect(() => {
    const load = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.privacySettings) {
        setSettings(config.privacySettings);
      }
    };
    load();
  }, []);

  const handleToggle = async (key: keyof PrivacySettingsState) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    const config = await window.electronAPI.getConfig?.();
    await window.electronAPI.saveConfig?.({
      ...config,
      privacySettings: updated
    });
  };

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Privacy Preferences</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="doNotTrack" className="text-sm">
            Send “Do Not Track” requests
          </label>
          <input
            id="doNotTrack"
            type="checkbox"
            checked={settings.sendDoNotTrack}
            onChange={() => handleToggle('sendDoNotTrack')}
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="blockThirdPartyCookies" className="text-sm">
            Block third-party cookies
          </label>
          <input
            id="blockThirdPartyCookies"
            type="checkbox"
            checked={settings.blockThirdPartyCookies}
            onChange={() => handleToggle('blockThirdPartyCookies')}
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="prefetchDns" className="text-sm">
            Allow DNS prefetching
          </label>
          <input
            id="prefetchDns"
            type="checkbox"
            checked={settings.prefetchDns}
            onChange={() => handleToggle('prefetchDns')}
          />
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
