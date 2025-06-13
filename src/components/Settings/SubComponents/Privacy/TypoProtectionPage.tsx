// src/components/Settings/SubComponents/Privacy/TypoProtectionPage.tsx

import React, { useEffect, useState } from 'react';
import BackButton from './BackButton';

const TypoProtectionPage = () => {
  const [typoProtection, setTypoProtection] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.typoProtection !== undefined) {
        setTypoProtection(config.typoProtection);
      }
    };
    fetchConfig();
  }, []);

  const handleToggle = async () => {
    const newValue = !typoProtection;
    setTypoProtection(newValue);

    const config = await window.electronAPI.getConfig?.();
    const updated = { ...config, typoProtection: newValue };
    await window.electronAPI.saveConfig?.(updated);
  };

  return (
    <div className="p-6 text-white space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold">Typo Protection</h2>
      <p className="text-gray-400">
        Help protect against common mistyped domains that may lead to malicious sites.
      </p>

      <div className="flex items-center gap-3">
        <label className="font-medium">Enable typo protection:</label>
        <input
          type="checkbox"
          checked={typoProtection}
          onChange={handleToggle}
        />
      </div>
    </div>
  );
};

export default TypoProtectionPage;
