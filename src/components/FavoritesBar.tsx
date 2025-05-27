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

  useEffect(() => {
    try {
      const config = window.electronAPI?.getConfig?.();
      if (config && Array.isArray(config.favorites)) {
        setFavorites(config.favorites);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error("FavoritesBar config load failed:", err);
      setFavorites([]);
    }
  }, []);

  return (
    <div className="flex bg-neutral-800 px-2 py-1 border-b border-gray-700 overflow-x-auto">
      {(favorites ?? []).map((fav, idx) => (
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
