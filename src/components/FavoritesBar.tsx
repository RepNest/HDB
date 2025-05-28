
import React, { useEffect, useState } from 'react';

interface FavoritesBarProps {
  onFavoriteClick: (url: string) => void;
}

export default function FavoritesBar({ onFavoriteClick }: FavoritesBarProps) {
  const [favorites, setFavorites] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    if (window.electronAPI?.getConfig) {
      const config = window.electronAPI.getConfig();
      setFavorites(config.favorites || []);
    }
  }, []);

  return (
    <div className="flex bg-neutral-800 px-2 py-1 border-b border-gray-700 overflow-x-auto">
      {(favorites || []).map((fav, idx) => (
        <button
          key={idx}
          onClick={() => onFavoriteClick(fav.url)}
          className="text-sm bg-gray-700 hover:bg-purple-600 text-white px-3 py-1 rounded-full mx-1"
        >
          {fav.name}
        </button>
      ))}
    </div>
  );
}
