import React, { useEffect, useState } from 'react';

type SecuritySettingsState = {
  safeBrowsingEnabled: boolean;
  autoUpgradeHttps: boolean;
  showCertificateWarnings: boolean;
};

const SecurityPage = () => {
  const [settings, setSettings] = useState<SecuritySettingsState>({
    safeBrowsingEnabled: true,
    autoUpgradeHttps: true,
    showCertificateWarnings: true
  });

  useEffect(() => {
    const load = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.securitySettings) {
        setSettings(config.securitySettings);
      }
    };
    load();
  }, []);

  const handleToggle = async (key: keyof SecuritySettingsState) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    const config = await window.electronAPI.getConfig?.();
    await window.electronAPI.saveConfig?.({
      ...config,
      securitySettings: updated
    });
  };

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Security Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="safeBrowsing" className="text-sm">
            Enable Safe Browsing
          </label>
          <input
            id="safeBrowsing"
            type="checkbox"
            checked={settings.safeBrowsingEnabled}
            onChange={() => handleToggle('safeBrowsingEnabled')}
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="autoUpgradeHttps" className="text-sm">
            Always upgrade to HTTPS
          </label>
          <input
            id="autoUpgradeHttps"
            type="checkbox"
            checked={settings.autoUpgradeHttps}
            onChange={() => handleToggle('autoUpgradeHttps')}
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="showCertificateWarnings" className="text-sm">
            Show certificate warnings
          </label>
          <input
            id="showCertificateWarnings"
            type="checkbox"
            checked={settings.showCertificateWarnings}
            onChange={() => handleToggle('showCertificateWarnings')}
          />
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
