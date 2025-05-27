import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface AppEntry {
  name: string;
  command: string;
  icon?: string;
}

interface WebEntry {
  name: string;
  url: string;
  icon?: string;
}

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [webShortcuts, setWebShortcuts] = useState<WebEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const config = window.electronAPI?.getConfig?.();
    if (config) {
      setApps(config.apps || []);
      setWebShortcuts(config.favorites || []);
    }
  }, []);

  const launchApp = (cmd: string) => {
    window.electronAPI?.launchApp(cmd);
  };

  const openUrl = (url: string) => {
    window.open(url);
  };

  const filteredApps = apps.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredWeb = webShortcuts.filter(web => web.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={clsx(
      'transition-all duration-300 bg-black h-full flex flex-col py-4 shadow-lg',
      isOpen ? 'w-64 px-3' : 'w-16 items-center'
    )}>
      <button onClick={toggle} className="mb-4 text-white hover:text-purple-400 w-full text-left">{isOpen ? '☰ Close' : '☰'}</button>

      {isOpen && (
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="mb-4 px-2 py-1 rounded bg-gray-800 text-white w-full"
        />
      )}

      <div className={clsx('text-xs text-gray-400 mb-2', isOpen ? 'text-left' : 'text-center')}>Apps</div>
      {filteredApps.map((app, idx) => (
        <button
          key={idx}
          onClick={() => launchApp(app.command)}
          className="w-full my-1 flex items-center space-x-2 text-white hover:bg-purple-600 rounded px-2 py-1"
          title={app.name}
        >
          <span>{app.icon || '🗂️'}</span>
          {isOpen && <span>{app.name}</span>}
        </button>
      ))}

      <div className={clsx('text-xs text-gray-400 mt-4 mb-2', isOpen ? 'text-left' : 'text-center')}>Web</div>
      {filteredWeb.map((web, idx) => (
        <button
          key={idx}
          onClick={() => openUrl(web.url)}
          className="w-full my-1 flex items-center space-x-2 text-white hover:bg-indigo-600 rounded px-2 py-1"
          title={web.name}
        >
          <span>{web.icon || '🌐'}</span>
          {isOpen && <span>{web.name}</span>}
        </button>
      ))}
    </div>
  );
}
