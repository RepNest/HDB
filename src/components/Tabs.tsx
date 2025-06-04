import React from 'react';
import clsx from 'clsx';

interface Tab {
  id: number;
  title: string;
  url: string;
  favicon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTabId: number;
  setActiveTabId: (id: number) => void;
  handleCloseTab: (id: number) => void;
}

export default function Tabs({ tabs, activeTabId, setActiveTabId, handleCloseTab }: TabsProps) {
  return (
    <div className="flex space-x-2 px-3 py-2 bg-black border-b border-gray-800 overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => setActiveTabId(tab.id)}
          className={clsx(
            'px-4 py-1 rounded-full text-sm cursor-pointer font-medium transition-all flex items-center',
            tab.id === activeTabId ? 'bg-pink-600' : 'bg-gray-700 hover:bg-purple-600'
          )}
        >
          {tab.favicon && (
            <img
              src={tab.favicon}
              alt="favicon"
              className="w-4 h-4 mr-2 rounded"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          )}
          {tab.title.length > 25 ? tab.title.slice(0, 25) + '…' : tab.title}
          <span
            className="ml-2 text-red-300 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              handleCloseTab(tab.id);
            }}
          >
            ×
          </span>
        </div>
      ))}
    </div>
  );
}
