// src/components/Settings/SubComponents/Privacy/TrackingPreventionPage.tsx

import React, { useEffect, useState } from 'react';
import BackButton from './BackButton';

const TrackingPreventionPage = () => {
  const [level, setLevel] = useState<'basic' | 'balanced' | 'strict'>('balanced');

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.privacy?.trackingPrevention) {
        setLevel(config.privacy.trackingPrevention);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = async (newLevel: 'basic' | 'balanced' | 'strict') => {
    setLevel(newLevel);
    const config = await window.electronAPI.getConfig?.();
    const newConfig = {
      ...config,
      privacy: {
        ...config.privacy,
        trackingPrevention: newLevel,
      },
    };
    await window.electronAPI.saveConfig?.(newConfig);
  };

  return (
    <div className="p-6 text-white space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold">Tracking Prevention</h2>
      <p className="text-gray-400">
        Choose how you want to prevent websites from tracking your browsing activity.
      </p>

      <div className="space-y-4 mt-4">
        {(['basic', 'balanced', 'strict'] as const).map(option => (
          <label
            key={option}
            className={`block p-4 border rounded cursor-pointer ${
              level === option ? 'border-purple-500 bg-neutral-800' : 'border-neutral-700'
            }`}
          >
            <input
              type="radio"
              name="trackingLevel"
              value={option}
              checked={level === option}
              onChange={() => handleChange(option)}
              className="mr-2"
            />
            <strong className="capitalize">{option}</strong>
            <div className="text-sm text-gray-400">
              {option === 'basic' && 'Allows most trackers. Least protection, best compatibility.'}
              {option === 'balanced' && 'Blocks some trackers. Recommended default.'}
              {option === 'strict' && 'Blocks most trackers. May break some websites.'}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default TrackingPreventionPage;
