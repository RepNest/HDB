import React, { useEffect, useState } from 'react';

const HistorySettings = () => {
  const [history, setHistory] = useState([]);

useEffect(() => {
    const fetchHistory = async () => {
      const config = await window.electronAPI.getConfig();
      if (config?.history) {
        setHistory(config.history);
      }
    };
    fetchHistory();
  }, []);

return (
    <div>   
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
export default HistorySettings;