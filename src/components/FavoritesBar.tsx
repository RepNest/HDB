import React, { useState, useEffect } from 'react';

interface FavoritesBarProps {
  onFavoriteClick: (url: string) => void;
}

interface Favorite {
  name: string;
  url: string;
  favicon?: string;
}

export default function FavoritesBar({ onFavoriteClick }: FavoritesBarProps) {
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
    <div className="flex bg-neutral-800 px-2 py-1 border-b border-gray-700 overflow-x-auto">
      {favorites.map((fav, idx) => (
        <button
          key={idx}
          onClick={() => onFavoriteClick(fav.url)}
          className="text-sm bg-gray-700 hover:bg-purple-600 text-white px-3 py-1 rounded-full mx-1"
          title={fav.name}
        >
          {fav.name.length > 15 ? fav.name.slice(0, 15) + '…' : fav.name}
        </button>
      ))}
    </div>
  );
}