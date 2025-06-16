import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';
import { Config, ElectronWebview, Favorite } from '../types';

interface BookmarkPopupProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  webviewRef: ElectronWebview | null;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  isDarkMode: boolean;
  position: { top: string; right: number };
  initialName?: string;
  initialFolder?: string;
  onSave?: (bookmark: Favorite, folder: string) => void;
}

const BookmarkPopup: React.FC<BookmarkPopupProps> = ({
  isOpen,
  onClose,
  url,
  webviewRef,
  config,
  setConfig,
  isDarkMode,
  position,
  initialName,
  initialFolder,
  onSave,
}) => {
  const [bookmarkName, setBookmarkName] = useState(initialName || '');
  const [selectedFolder, setSelectedFolder] = useState(initialFolder || 'Favorites');
  const [newFolderName, setNewFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && !initialName && webviewRef) {
      setBookmarkName(webviewRef.title || new URL(url).hostname);
    }
  }, [isOpen, url, webviewRef, initialName]);

  const getFaviconUrl = async (pageUrl: string): Promise<string> => {
    try {
      const response = await fetch(pageUrl);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const faviconLink = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
      if (faviconLink && faviconLink.getAttribute('href')) {
        const faviconPath = faviconLink.getAttribute('href')!;
        return faviconPath.startsWith('http') ? faviconPath : new URL(faviconPath, pageUrl).href;
      }
    } catch (err: unknown) { // Fixed: Changed err: Error to err: unknown (Line 57)
      console.warn(
        `Failed to fetch favicon for ${pageUrl}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
    return `https://${new URL(pageUrl).hostname}/favicon.ico`; // Fallback
  };

  const debouncedSaveBookmark = debounce(async (bookmark: Favorite, folder: string) => {
    const existingBookmark = (config.favorites[folder] || []).find((fav) => fav.url === bookmark.url);
    if (existingBookmark && !onSave) {
      const overwrite = window.confirm(
        `A bookmark for ${bookmark.url} already exists in "${folder}". Do you want to overwrite it?`
      );
      if (!overwrite) {
        setIsSaving(false);
        return;
      }
    }

    const updatedFavorites = {
      ...config.favorites,
      [folder]: existingBookmark
        ? (config.favorites[folder] || []).map((fav) => (fav.url === bookmark.url ? bookmark : fav))
        : [...(config.favorites[folder] || []), bookmark],
    };

    try {
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (success) {
        setConfig((prev) => ({
          ...prev,
          favorites: updatedFavorites,
        }));
        console.log(`Bookmark "${bookmark.name}" saved to "${folder}" at ${new Date().toISOString()}`);
        onClose();
        setBookmarkName('');
        setSelectedFolder('Favorites');
        setNewFolderName('');
      } else {
        setError('Failed to save bookmark');
      }
    } catch (err: unknown) { // Fixed: Added err: unknown (Line 98)
      setError(`Error saving bookmark: ${err instanceof Error ? err.message : 'Unknown error'}`); // Fixed: Added type guard
    } finally {
      setIsSaving(false);
    }
  }, 300);

  const handleSaveBookmark = async () => {
    if (!bookmarkName || !url) {
      setError('Bookmark name and URL are required');
      return;
    }

    const folder = selectedFolder === 'new' ? newFolderName : selectedFolder;
    if (selectedFolder === 'new' && !newFolderName) {
      setError('New folder name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    const favicon = await getFaviconUrl(url);
    const newFavorite = {
      name: bookmarkName,
      url,
      favicon,
    };

    if (onSave) {
      onSave(newFavorite, folder);
      onClose();
      setBookmarkName('');
      setSelectedFolder('Favorites');
      setNewFolderName('');
      setIsSaving(false);
      return;
    }

    debouncedSaveBookmark(newFavorite, folder);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'absolute border rounded-lg shadow-md p-4 z-[1000]',
        isDarkMode ? 'bg-neutral-900 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
      )}
      style={{
        top: position.top,
        right: position.right,
        minWidth: '250px',
      }}
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm">Bookmark Name</label>
        <input
          type="text"
          value={bookmarkName}
          onChange={(e) => setBookmarkName(e.target.value)}
          className={clsx(
            'w-full px-2 py-1 text-sm rounded border',
            isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          )}
          placeholder="Enter bookmark name"
        />
        <label className="text-sm mt-2">Folder</label>
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className={clsx(
            'w-full px-2 py-1 text-sm rounded border',
            isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          )}
        >
          {Object.keys(config.favorites).map((folder) => (
            <option key={folder} value={folder}>
              {folder || 'Favorites'}
            </option>
          ))}
          <option value="new">New Folder...</option>
        </select>
        {selectedFolder === 'new' && (
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className={clsx(
              'w-full px-2 py-1 text-sm rounded border mt-2',
              isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            )}
            placeholder="Enter new folder name"
          />
        )}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => {
              onClose();
              setError('');
            }}
            className={clsx(
              'px-4 py-1 text-sm rounded transition-all',
              isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
            )}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveBookmark}
            className={clsx(
              'px-4 py-1 text-sm rounded transition-all',
              isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
            disabled={isSaving || !bookmarkName || (selectedFolder === 'new' && !newFolderName)}
          >
            {isSaving ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default BookmarkPopup;