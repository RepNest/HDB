import React, { useEffect, useState } from 'react';
import BackButton from './BackButton';

const TrackingPreventionPage = () => {
  const [level, setLevel] = useState<'Basic' | 'Balanced' | 'Strict'>('Balanced');
  const [showBlockList, setShowBlockList] = useState(false);

  useEffect(() => {
    const load = async () => {
      const config = await window.electronAPI.getConfig?.();
      if (config?.trackingPreventionLevel) {
        setLevel(config.trackingPreventionLevel);
      }
    };
    load();
  }, []);

  const handleLevelChange = async (newLevel: 'Basic' | 'Balanced' | 'Strict') => {
    setLevel(newLevel);
    const config = await window.electronAPI.getConfig?.();
    await window.electronAPI.saveConfig?.({
      ...config,
      trackingPreventionLevel: newLevel
    });
  };

  return (
    <div className="space-y-6 text-white">
      <BackButton />
      <h2 className="text-2xl font-bold mb-4">Tracking Prevention</h2>

      <p className="text-gray-400">
        Choose how strictly the browser blocks known trackers. “Balanced” is recommended.
      </p>

      <div className="space-y-3">
        {(['Basic', 'Balanced', 'Strict'] as const).map(option => (
          <label key={option} className="block cursor-pointer">
            <input
              type="radio"
              name="trackingLevel"
              value={option}
              checked={level === option}
              onChange={() => handleLevelChange(option)}
              className="mr-2"
            />
            <span className="font-semibold">{option}</span>
            {option === 'Basic' && <p className="text-sm text-gray-500 ml-6">Allows most trackers, minimal blocking.</p>}
            {option === 'Balanced' && <p className="text-sm text-gray-500 ml-6">Blocks known harmful trackers (recommended).</p>}
            {option === 'Strict' && <p className="text-sm text-gray-500 ml-6">Blocks most trackers aggressively.</p>}
          </label>
        ))}
      </div>

      <div>
        <button
          onClick={() => setShowBlockList(!showBlockList)}
          className="mt-4 text-blue-400 hover:underline"
        >
          {showBlockList ? 'Hide' : 'View'} blocked tracker list
        </button>

        {showBlockList && (
          <div className="mt-4 p-3 bg-neutral-800 border border-gray-600 rounded max-h-60 overflow-y-auto text-sm text-gray-300">
            <ul className="list-disc pl-5 space-y-1">
              <li>adtracker.example.com</li>
              <li>analytics.doubleclick.net</li>
              <li>socialwidgets.tracker.io</li>
              <li>ads.retargeting.biz</li>
              <li>pixel.facebook.com</li>
              <li>tracker123.adnetwork.net</li>
              <li>example-tracker.org</li>
              <li>cdn.trackerspace.com</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPreventionPage;
