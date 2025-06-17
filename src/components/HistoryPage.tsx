import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useConfig } from './ConfigContext';
import { getHistory } from '../utils/history';

interface HistoryPageProps {
  onNavigate: (url: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const { config } = useConfig();
  const [history, setHistory] = useState(config.history);
  const [isDarkMode, setIsDarkMode] = useState(config.itdTools.isDarkMode ?? true);

  useEffect(() => {
    setIsDarkMode(config.itdTools.isDarkMode ?? true);
  }, [config.itdTools.isDarkMode]);

  useEffect(() => {
    const loadHistory = async () => {
      const fetchedHistory = await getHistory();
      setHistory(fetchedHistory);
    };
    loadHistory();
  }, []);

  return (
    <div
      className={clsx(
        'flex flex-col h-full p-6',
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      )}
    >
      <h1 className="text-2xl font-semibold mb-4">Browsing History</h1>
      {history.length === 0 ? (
        <p className="text-sm">No history entries found.</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto">
          {history.map((entry, index) => (
            <li
              key={`${entry.url}-${index}`}
              className={clsx(
                'p-2 rounded-lg transition-all',
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
              )}
            >
              <button
                onClick={() => onNavigate(entry.url)}
                className="w-full text-left"
                aria-label={`Navigate to ${entry.url}`}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate flex-1">{entry.url}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryPage;