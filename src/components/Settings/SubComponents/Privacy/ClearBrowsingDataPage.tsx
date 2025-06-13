// src/components/Settings/SubComponents/Privacy/ClearBrowsingDataPage.tsx

import React, { useState } from 'react';
import BackButton from './BackButton';

const ClearBrowsingDataPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [timeRange, setTimeRange] = useState('lastHour');
  const [options, setOptions] = useState({
    history: true,
    downloadHistory: true,
    cookies: true,
    cache: true,
    passwords: false,
    autofill: false
  });

  const handleToggle = (key: string) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClearData = async () => {
    const config = await window.electronAPI.getConfig?.();
    const updatedConfig = { ...config };

    const now = new Date();
    const cutoff = new Date();

    switch (timeRange) {
      case 'lastHour':
        cutoff.setHours(now.getHours() - 1);
        break;
      case 'last24Hours':
        cutoff.setHours(now.getHours() - 24);
        break;
      case 'last7Days':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'last4Weeks':
        cutoff.setDate(now.getDate() - 28);
        break;
      case 'allTime':
        cutoff.setTime(0);
        break;
      default:
        cutoff.setTime(0);
    }

    const isOld = (timestamp: string) => new Date(timestamp).getTime() < cutoff.getTime();

    if (options.history && Array.isArray(config?.history)) {
      updatedConfig.history = timeRange === 'allTime'
        ? []
        : config.history.filter((entry: { timestamp: string; }) => isOld(entry.timestamp));
    }

    if (options.downloadHistory && Array.isArray(config?.downloadHistory)) {
      updatedConfig.downloadHistory = timeRange === 'allTime'
        ? []
        : config.downloadHistory.filter((entry: { timestamp: string; }) => isOld(entry.timestamp));
    }

    if (options.cookies && Array.isArray(config?.cookies)) {
      updatedConfig.cookies = [];
    }

    if (options.cache && Array.isArray(config?.cache)) {
      updatedConfig.cache = timeRange === 'allTime'
        ? []
        : config.cache.filter((entry: { timestamp: string; }) => isOld(entry.timestamp));
    }

    if (options.passwords && Array.isArray(config?.passwords)) {
      updatedConfig.passwords = timeRange === 'allTime'
        ? []
        : config.passwords.filter((entry: { timestamp: string; }) => isOld(entry.timestamp));
    }

    if (options.autofill && Array.isArray(config?.autofill)) {
      updatedConfig.autofill = timeRange === 'allTime'
        ? []
        : config.autofill.filter((entry: { timestamp: string; }) => isOld(entry.timestamp));
    }

    await window.electronAPI.saveConfig?.(updatedConfig);
    setShowModal(false);
  };

  return (
    <div className="p-6 text-white space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold">Clear Browsing Data</h2>
      <p className="text-gray-400">Delete temporary files, cookies, cache, and more.</p>

      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
      >
        Choose what to clear
      </button>

      {/* <button
        onClick={() => window.location.href = 'about:settings/clearonclose'}
        className="text-blue-400 underline mt-4 block"
      >
        Choose what to clear every time you close the browser →
      </button> */}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-6 rounded shadow-md w-full max-w-md space-y-4">
            <h3 className="text-xl font-semibold mb-2">Clear browsing data</h3>

            <label className="block mb-2 text-sm font-medium">Time range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full bg-neutral-700 text-white p-2 rounded"
            >
              <option value="lastHour">Last hour</option>
              <option value="last24Hours">Last 24 hours</option>
              <option value="last7Days">Last 7 days</option>
              <option value="last4Weeks">Last 4 weeks</option>
              <option value="allTime">All time</option>
            </select>

            <div className="space-y-2">
              {Object.entries(options).map(([key, val]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={() => handleToggle(key)}
                  />
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded"
              >
                Clear now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClearBrowsingDataPage;
