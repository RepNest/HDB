import React from 'react';

interface Favorite {
  label: string;
  url: string;
}

interface FavoritesBarProps {
  onFavoriteClick: (url: string) => void;
}

declare global {
  interface Window {
    userConfig: {
      favorites: Favorite[];
    };
  }
}

const FavoritesBar: React.FC<FavoritesBarProps> = ({ onFavoriteClick }) => {
  const favorites = window.userConfig?.favorites || [];

  return (
    <div className="bg-zinc-900 text-white flex gap-2 px-4 py-2 border-b border-zinc-800 overflow-x-auto">
      {favorites.map((fav, idx) => (
        <button
          key={idx}
          onClick={() => onFavoriteClick(fav.url)}
          className="px-3 py-1 rounded-md bg-zinc-800 hover:bg-purple-600 text-sm whitespace-nowrap"
        >
          {fav.label}
        </button>
      ))}
    </div>
  );
};

export default FavoritesBar;