import React, { useEffect, useState } from 'react';

interface FavoritesBarProps {
  onFavoriteClick: (url: string) => void;
}

interface Favorite {
  name: string;
  url: string;
}

export default function FavoritesBar({ onFavoriteClick }: FavoritesBarProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // Poll every 2 seconds to stay synced
  useEffect(() => {
    const fetchFavorites = async () => {
      const config = await window.electronAPI.getConfig();
      if (Array.isArray(config.favorites)) {
        setFavorites(config.favorites);
      }
    };

    fetchFavorites(); // initial load
    const interval = setInterval(fetchFavorites, 2000);
    return () => clearInterval(interval);
  }, []);

  // const deleteFavorite = async (index: number) => {
  //   const updated = [...favorites];
  //   updated.splice(index, 1);
  //   setFavorites(updated); // optimistically update UI

  //   try {
  //     await window.electronAPI.saveFavorites?.(updated); // persist to disk
  //   } catch (err) {
  //     console.error('Failed to save favorites:', err);
  //   }
  // };

  const deleteFavorite = async (index: number) => {
  const updated = [...favorites];
  updated.splice(index, 1);
  setFavorites(updated); // UI update

  await window.electronAPI.saveFavorites?.(updated); // File update
};



  return (
    <div className="flex bg-neutral-800 px-2 py-1 border-b border-gray-700 overflow-x-auto items-center gap-2">
      {favorites.map((fav, idx) => (
        <div
          key={idx}
          className="flex items-center bg-gray-700 text-white rounded-full px-3 py-1 hover:bg-purple-600 transition-all text-sm"
        >
          <button
            className="mr-2"
            onClick={() => onFavoriteClick(fav.url)}
            title={fav.url}
          >
            {fav.name}
          </button>
          <button
            onClick={() => deleteFavorite(idx)}
            className="ml-1 text-red-300 hover:text-red-500"
            title="Delete favorite"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
