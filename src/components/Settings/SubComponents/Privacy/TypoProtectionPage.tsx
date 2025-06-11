import React, { useEffect, useState } from 'react';

const TypoProtectionPage = () => {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    const fetchSetting = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (typeof config?.typoProtectionEnabled === 'boolean') {
        setEnabled(config.typoProtectionEnabled);
      }
    };
    fetchSetting();
  }, []);

  const toggleTypoProtection = async () => {
    const newValue = !enabled;
    setEnabled(newValue);
    const config = await window.electronAPI.getConfig?.();
    await window.electronAPI.saveConfig?.({
      ...config,
      typoProtectionEnabled: newValue,
    });
  };

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Typo Protection</h2>
      <p className="text-gray-400">
        Enable spell checking and typo protection in form fields and input boxes.
      </p>
      <div className="flex items-center mt-4 gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={toggleTypoProtection}
          className="w-5 h-5"
        />
        <label className="text-lg">Enable typo protection</label>
      </div>
    </div>
  );
};

export default TypoProtectionPage;
