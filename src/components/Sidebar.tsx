import React from 'react';
import clsx from 'clsx';

const desktopApps = [
  { name: 'Notepad', command: 'notepad' },
  { name: 'Calculator', command: 'calc' },
  { name: 'Outlook', command: 'outlook'},
];

const webShortcuts = [
  { name: 'Outlook', url: 'https://outlook.office365.com' },
  { name: 'Remedy', url: 'https://smartit.miamidade.gov' },
];

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const launchApp = (cmd: string) => {
    window.electronAPI?.launchApp(cmd);
  };

  return (
    <div className={clsx(
      'transition-all duration-300 bg-black h-full flex flex-col items-center py-4 shadow-lg',
      isOpen ? 'w-64' : 'w-16'
    )}>
      <button onClick={toggle} className="mb-4 text-white hover:text-purple-400">☰</button>
      <div className="text-sm w-full text-center text-gray-400 mb-2">{isOpen ? 'Apps' : ''}</div>
      {desktopApps.map((app, idx) => (
        <button
          key={idx}
          onClick={() => launchApp(app.command)}
          className={clsx(
            'my-2 px-2 py-2 rounded-xl bg-gray-800 hover:bg-purple-600 transition-all text-white flex items-center',
            isOpen ? 'w-48 justify-start pl-4' : 'w-10 justify-center'
          )}
          title={app.name}
        >
          {isOpen ? app.name : app.name[0]}
        </button>
      ))}
      <div className="text-sm w-full text-center text-gray-400 mt-4 mb-2">{isOpen ? 'Web' : ''}</div>
      {webShortcuts.map((web, idx) => (
        <button
          key={idx}
          onClick={() => window.open(web.url)}
          className={clsx(
            'my-2 px-2 py-2 rounded-xl bg-gray-800 hover:bg-indigo-600 transition-all text-white flex items-center',
            isOpen ? 'w-48 justify-start pl-4' : 'w-10 justify-center'
          )}
          title={web.name}
        >
          {isOpen ? web.name : web.name[0]}
        </button>
      ))}
    </div>
  );
}