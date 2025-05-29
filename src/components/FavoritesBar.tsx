import React, { useEffect, useState } from 'react';

interface Favorite {
  name: string;
  url: string;
}

interface FavoritesBarProps {
  onFavoriteClick: (url: string) => void;
}

export default function FavoritesBar({ onFavoriteClick }: FavoritesBarProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // ✅ Load saved favorites from config
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const config: any = await window.electronAPI?.getConfig?.();
        setFavorites(config?.favorites || []);
      } catch (err) {
        console.error('Failed to load favorites:', err);
      }
    };
    loadFavorites(); // initial load
    const interval = setInterval(loadFavorites, 2000); // refresh every 2 sec

    return () => clearInterval(interval); // cleanup
  }, []);

  return (
    <div className="flex bg-neutral-800 px-2 py-1 border-b border-gray-700 overflow-x-auto">
      {favorites.map((fav, idx) => (
        <button
          key={idx}
          onClick={() => onFavoriteClick(fav.url)}
          title={fav.name}
          className="text-sm bg-gray-700 hover:bg-purple-600 text-white px-3 py-1 rounded-full mx-1 whitespace-nowrap"
        >
          {fav.name}
        </button>
      ))}
    </div>
  );
}
