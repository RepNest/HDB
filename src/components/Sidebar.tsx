import React from 'react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const config = window.electronAPI?.getConfig?.();
  const apps = config?.apps || [];
  const favorites = config?.favorites || [];

  const launchApp = (cmd: string) => {
    window.electronAPI?.launchApp(cmd);
  };

  const openUrl = (url: string) => {
    window.open(url);
  };

  return (
    <div
      className={clsx(
        'transition-all duration-300 bg-black h-full flex flex-col py-4 shadow-lg text-white',
        isOpen ? 'w-64 px-4' : 'w-16 items-center'
      )}
    >
      <button onClick={toggle} className="mb-6 text-white hover:text-purple-400">
        ☰
      </button>

      <div className="text-sm text-gray-400 mb-2">{isOpen ? 'Apps' : ''}</div>
      {apps.map((app, idx) => (
        <button
          key={idx}
          onClick={() => launchApp(app.command)}
          className={clsx(
            'my-1 flex items-center gap-2 bg-gray-800 hover:bg-purple-600 transition-all rounded-xl py-2 px-3 w-full',
            isOpen ? 'justify-start' : 'justify-center w-10 h-10'
          )}
          title={app.name}
        >
          <span className="text-lg">{app.name[0]}</span>
          {isOpen && <span className="text-sm font-medium">{app.name}</span>}
        </button>
      ))}

      <div className="text-sm text-gray-400 mt-6 mb-2">{isOpen ? 'Web' : ''}</div>
      {favorites.map((fav, idx) => (
        <button
          key={idx}
          onClick={() => openUrl(fav.url)}
          className={clsx(
            'my-1 flex items-center gap-2 bg-gray-800 hover:bg-indigo-600 transition-all rounded-xl py-2 px-3 w-full',
            isOpen ? 'justify-start' : 'justify-center w-10 h-10'
          )}
          title={fav.name}
        >
          <span className="text-lg">{fav.name[0]}</span>
          {isOpen && <span className="text-sm font-medium">{fav.name}</span>}
        </button>
      ))}
    </div>
  );
}
