import React, { useState } from 'react';
import { useNavigate } from '../../../../hooks/useNavigate';

const ClearBrowsingDataPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [timeRange, setTimeRange] = useState('lastHour');
  const [options, setOptions] = useState({
    browsingHistory: true,
    downloadHistory: true,
    cookies: true,
    cache: true,
    passwords: false,
    autofill: false
  });

  const navigate = useNavigate();

  const clearData = () => {
    console.log('Clearing data with options:', { timeRange, ...options });
    setShowModal(false);
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-2">Clear browsing data</h2>
      <p>This includes history, passwords, cookies, and more. Only data from this profile will be deleted.</p>

      <div className="border border-gray-600 rounded">
        <div className="flex justify-between items-center px-4 py-3 hover:bg-neutral-800">
          <span className="font-medium">Clear browsing data now</span>
          <button
            onClick={() => setShowModal(true)}
            className="border px-3 py-1 rounded hover:bg-gray-700"
          >
            Choose what to clear
          </button>
        </div>

        <div
          className="px-4 py-3 hover:bg-neutral-800 cursor-pointer"
          onClick={() => navigate('about:settings/clearonclose')}
        >
          Choose what to clear every time you close the browser
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-neutral-800 text-white p-6 rounded w-96 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Delete browsing data</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div>
              <label className="block text-sm mb-1">Time range</label>
              <select
                className="w-full p-2 bg-neutral-700 rounded"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="lastHour">Last hour</option>
                <option value="last24Hours">Last 24 hours</option>
                <option value="last7Days">Last 7 days</option>
                <option value="last4Weeks">Last 4 weeks</option>
                <option value="allTime">All time</option>
              </select>
            </div>

            {Object.entries(options).map(([key, checked]) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOption(key as keyof typeof options)}
                />
                <label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={clearData}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
              >
                Clear now
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClearBrowsingDataPage;
