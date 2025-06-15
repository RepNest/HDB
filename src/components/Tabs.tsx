import React from 'react';
import clsx from 'clsx';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Tab } from '../types';

interface TabsProps {
  tabs: Tab[];
  activeTabId: number;
  onTabClick: (id: number) => void;
  onCloseTab: (id: number) => void;
  onNewTab: () => void;
  navColor: string;
  isDarkMode: boolean;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTabId, onTabClick, onCloseTab, onNewTab, navColor, isDarkMode }) => {
  return (
    <div
      className={clsx(
        'flex items-center border-b overflow-x-auto z-[900] w-full',
        isDarkMode ? 'bg-neutral-900 border-gray-700' : 'bg-gray-100 border-gray-300'
      )}
    >
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={clsx(
            'flex items-center px-4 py-2 cursor-pointer border-r min-w-[150px] max-w-[200px] transition-all',
            activeTabId === tab.id
              ? isDarkMode
                ? `bg-gray-800 text-white border-b-2 border-${navColor}-300`
                : `bg-white text-gray-900 border-b-2 border-${navColor}-500`
              : isDarkMode
              ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
            isDarkMode ? 'border-gray-700' : 'border-gray-300'
          )}
          onClick={() => onTabClick(tab.id)}
        >
          <span className="truncate flex-1">{tab.title || 'New Tab'}</span>
          <button
            onClick={e => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            className={clsx(
              'ml-2 w-5 h-5 flex items-center justify-center rounded-full transition-all',
              isDarkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-400'
            )}
          >
            <XMarkIcon className={clsx('w-4 h-4', isDarkMode ? 'fill-white' : 'fill-gray-900')} />
          </button>
        </div>
      ))}
      <button
        onClick={onNewTab}
        className={clsx(
          'px-4 py-2 text-sm transition-all',
          isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-200'
        )}
      >
        +
      </button>
    </div>
  );
};

export default Tabs;