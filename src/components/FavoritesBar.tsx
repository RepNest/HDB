import React, { useState, useEffect } from 'react';
import clsx from 'clsx'; // Add this import

interface FavoritesBarProps {
  onFavoriteClick: (url: string) => void;
  navColor: string;
}

interface Favorite {
  name: string;
  url: string;
  favicon?: string;
}

export default function FavoritesBar({ onFavoriteClick, navColor }: FavoritesBarProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const config = await window.electronAPI?.getConfig?.();
        if (config?.favorites && typeof config.favorites === 'object' && !Array.isArray(config.favorites)) {
          const allFavorites = Object.values(config.favorites).flat() as Favorite[];
          setFavorites(allFavorites);
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error("FavoritesBar config load failed:", err);
        setFavorites([]);
      }
    };
    loadFavorites();
  }, []);

  return (
    <div className={clsx('flex px-2 py-1 border-b border-gray-800 dark:border-gray-300 overflow-x-auto z-[1000]', `bg-${navColor}-600 dark:bg-${navColor}-300`)}>
      {favorites.map((fav, idx) => (
        <button
          key={idx}
          onClick={() => onFavoriteClick(fav.url)}
          className={clsx(
            'text-sm text-white dark:text-gray-900 px-3 py-1 rounded-full mx-1 transition-all',
            `bg-${navColor}-700 dark:bg-${navColor}-200 hover:bg-${navColor}-800 dark:hover:bg-${navColor}-400`
          )}
          title={fav.name}
        >
          {fav.name.length > 15 ? fav.name.slice(0, 15) + '…' : fav.name}
        </button>
      ))}
    </div>
  );
}