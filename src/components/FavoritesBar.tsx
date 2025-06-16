import React, { useState } from 'react';
import clsx from 'clsx';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { Favorites } from '../types';

interface FavoritesBarProps {
  favorites: Favorites;
  onNavigate: (url: string) => void;
  navColor: string;
  isDarkMode: boolean;
}

const FavoritesBar: React.FC<FavoritesBarProps> = ({ favorites, onNavigate, navColor, isDarkMode }) => {
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  const toggleFolder = (folder: string) => {
    setOpenFolder(openFolder === folder ? null : folder);
  };

  return (
    <div
      className={clsx(
        'flex items-center p-2 border-b z-[800] w-full',
        isDarkMode ? `bg-${navColor}-300 border-${navColor}-400` : `bg-${navColor}-600 border-${navColor}-700`
      )}
    >
      {Object.entries(favorites).map(([folder, items]) => (
        <div key={folder} className="relative">
          <button
            onClick={() => toggleFolder(folder)}
            className={clsx(
              'flex items-center px-3 py-1 rounded transition-all',
              isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
            )}
          >
            <span>{folder || 'Favorites'}</span>
            <ChevronDownIcon
              className={clsx('w-4 h-4 ml-1', isDarkMode ? 'fill-white' : 'fill-gray-900')}
            />
          </button>
          {openFolder === folder && (
            <div
              className={clsx(
                'absolute top-full left-0 mt-1 rounded shadow-md z-[810]',
                isDarkMode ? 'bg-neutral-900 border-gray-700' : 'bg-gray-100 border-gray-300'
              )}
            >
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onNavigate(item.url);
                    setOpenFolder(null);
                  }}
                  className={clsx(
                    'block w-full text-left px-4 py-2 text-sm transition-all',
                    isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-200'
                  )}
                >
                  {item.favicon && (
                    <img src={item.favicon} alt="" className="inline w-4 h-4 mr-2" />
                  )}
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FavoritesBar;