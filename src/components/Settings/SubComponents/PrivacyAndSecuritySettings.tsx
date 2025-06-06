import React, { useEffect, useState } from 'react';

const PrivacyAndSecuritySettings = () => {
  const [history, setHistory] = useState([]);
  const [clearOnClose, setClearOnClose] = useState({
    history: false,
    cookies: false,
    cache: false,
    passwords: false,
    autofill: false,
    sitePermissions: false
  });

  useEffect(() => {
    const fetchHistory = async () => {
      const config = await window.electronAPI.getConfig();
      if (config?.history) {
        setHistory(config.history);
      }
    };
    fetchHistory();
  }, []);

  const handleClearNow = async () => {
    await window.electronAPI.saveHistory([]);
    setHistory([]);
  };

  const toggleClearOnClose = (key) => {
    const updated = { ...clearOnClose, [key]: !clearOnClose[key] };
    setClearOnClose(updated);
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold mb-2">Clear Browsing Data</h2>
        <button onClick={handleClearNow} className="bg-blue-600 text-white px-4 py-2 rounded">
          Clear Now
        </button>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-2">Clear on Close</h2>
        {Object.keys(clearOnClose).map((key) => (
          <div key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={clearOnClose[key]}
              onChange={() => toggleClearOnClose(key)}
            />
            <label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-2">Browsing History</h2>
        {history.length === 0 ? (
          <p>No browsing history found.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {history.map((entry, index) => (
              <li key={index}>{entry.url}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default PrivacyAndSecuritySettings;
