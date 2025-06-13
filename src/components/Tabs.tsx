import React from 'react';
import clsx from 'clsx';

interface Tab {
  id: number;
  title: string;
  url: string;
  favicon?: string;
  isNew?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTabId: number;
  setActiveTabId: (id: number) => void;
  handleCloseTab: (id: number) => void;
  markTabAsNotNew: (id: number) => void;
  navColor: string;
}

export default function Tabs({ tabs, activeTabId, setActiveTabId, handleCloseTab, markTabAsNotNew, navColor }: TabsProps) {
  return (
    <div className={clsx('flex space-x-4 px-4 py-3 border-b border-gray-800 dark:border-gray-300 overflow-x-auto z-[1000]', `bg-${navColor}-600 dark:bg-${navColor}-300`)}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => setActiveTabId(tab.id)}
          className={clsx(
            'px-6 py-3 rounded-md text-lg font-semibold cursor-pointer transition-all flex items-center gap-3',
            tab.id === activeTabId ? `bg-${navColor}-700 dark:bg-${navColor}-400` : 'bg-gray-700 dark:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-300',
            tab.isNew ? 'animate-new-tab opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          )}
          title={tab.title}
          onAnimationEnd={() => tab.isNew && markTabAsNotNew(tab.id)}
        >
          {tab.favicon && (
            <img
              src={tab.favicon}
              alt="favicon"
              className="w-6 h-6 rounded-sm"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          )}
          <span className="truncate max-w-[200px] text-white dark:text-gray-900">{tab.title}</span>
          <span
            className="text-xl text-red-300 dark:text-red-600 hover:text-red-500 dark:hover:text-red-700"
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