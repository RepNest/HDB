
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const [apps, setApps] = useState<{ name: string; command: string }[]>([]);
  const [favorites, setFavorites] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    const config = window.electronAPI?.getConfig();
    if (config) {
      setApps(config.apps || []);
      setFavorites(config.favorites || []);
    }
  }, []);

  const launchApp = (cmd: string) => {
    window.electronAPI?.launchApp(cmd);
  };

  const openInTab = (url: string) => {
    const event = new CustomEvent('open-tab', { detail: { url } });
    window.dispatchEvent(event);
  };

  return (
    <div className={clsx(
      'transition-all duration-300 bg-black h-full flex flex-col py-4 shadow-lg',
      isOpen ? 'w-64 px-2' : 'w-16 items-center'
    )}>
      <button onClick={toggle} className="mb-4 text-white hover:text-purple-400 self-center">☰</button>

      <div className={clsx('text-sm text-gray-400 mb-2', isOpen ? 'pl-2' : '')}>Apps</div>
      {apps.map((app, idx) => (
        <button
          key={idx}
          onClick={() => launchApp(app.command)}
          className={clsx(
            'my-1 py-2 px-2 rounded-xl bg-gray-800 hover:bg-purple-600 transition-all text-white flex items-center',
            isOpen ? 'w-full justify-start' : 'w-10 h-10 justify-center'
          )}
          title={app.name}
        >
          <span className="font-bold">{app.name[0]}</span>
          {isOpen && <span className="ml-2 truncate">{app.name}</span>}
        </button>
      ))}

      <div className={clsx('text-sm text-gray-400 mt-4 mb-2', isOpen ? 'pl-2' : '')}>Web</div>
      {favorites.map((fav, idx) => (
        <button
          key={idx}
          onClick={() => openInTab(fav.url)}
          className={clsx(
            'my-1 py-2 px-2 rounded-xl bg-gray-800 hover:bg-indigo-600 transition-all text-white flex items-center',
            isOpen ? 'w-full justify-start' : 'w-10 h-10 justify-center'
          )}
          title={fav.name}
        >
          <span className="font-bold">{fav.name[0]}</span>
          {isOpen && <span className="ml-2 truncate">{fav.name}</span>}
        </button>
      ))}
    </div>
  );
}
