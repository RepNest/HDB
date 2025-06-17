import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';
import { Favorite, ElectronWebview } from '../types';
import { useConfig } from './ConfigContext';
import { getFaviconUrl } from '../utils/favicon';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface BookmarkPopupProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  webviewRef: ElectronWebview | null;
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
  isDarkMode,
  position,
  initialName,
  initialFolder,
  onSave,
}) => {
  const { config, setConfig } = useConfig();
  const { error, handleError, clearError } = useErrorHandler();
  const [bookmarkName, setBookmarkName] = useState(initialName || '');
  const [selectedFolder, setSelectedFolder] = useState(initialFolder || 'Favorites');
  const [newFolderName, setNewFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !initialName && webviewRef) {
      setBookmarkName(webviewRef.title || new URL(url).hostname);
    }
  }, [isOpen, url, webviewRef, initialName]);

  useEffect(() => {
    if (isOpen) {
      const firstInput = popupRef.current?.querySelector('input');
      firstInput?.focus();
    }
  }, [isOpen]);

  const debouncedSaveBookmark = debounce(async (bookmark: Favorite, folder: string) => {
    try {
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

      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (!success) {
        throw new Error('Failed to save bookmark');
      }

      setConfig((prev) => ({
        ...prev,
        favorites: updatedFavorites,
      }));
      console.log(`Bookmark "${bookmark.name}" saved to "${folder}" at ${new Date().toISOString()}`);
      onClose();
      setBookmarkName('');
      setSelectedFolder('Favorites');
      setNewFolderName('');
    } catch (err: unknown) {
      handleError(err, 'Error saving bookmark');
    } finally {
      setIsSaving(false);
    }
  }, 300);

  const validateInputs = (): boolean => {
    if (!bookmarkName || !url) {
      handleError(null, 'Bookmark name and URL are required');
      return false;
    }
    if (selectedFolder === 'new' && !newFolderName) {
      handleError(null, 'New folder name is required');
      return false;
    }
    return true;
  };

  const handleSaveBookmark = async () => {
    if (!validateInputs()) return;

    setIsSaving(true);
    clearError();

    try {
      const favicon = await getFaviconUrl(url);
      const newFavorite = {
        name: bookmarkName,
        url,
        favicon,
      };
      const folder = selectedFolder === 'new' ? newFolderName : selectedFolder;

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
    } catch (err: unknown) {
      handleError(err, 'Error fetching favicon');
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'absolute border rounded-lg shadow-md p-4 z-[1000]',
        isDarkMode ? 'bg-neutral-900 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
      )}
      style={{ top: position.top, right: position.right, minWidth: '250px' }}
      role="dialog"
      aria-labelledby="bookmark-popup-title"
      tabIndex={-1}
    >
      <h2 id="bookmark-popup-title" className="sr-only">Add Bookmark</h2>
      <div className="flex flex-col gap-2">
        <label htmlFor="bookmark-name" className="text-sm">Bookmark Name</label>
        <input
          id="bookmark-name"
          type="text"
          value={bookmarkName}
          onChange={(e) => setBookmarkName(e.target.value)}
          className={clsx(
            'w-full px-2 py-1 text-sm rounded border',
            isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          )}
          placeholder="Enter bookmark name"
          aria-required="true"
        />
        <label htmlFor="folder-select" className="text-sm mt-2">Folder</label>
        <select
          id="folder-select"
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className={clsx(
            'w-full px-2 py-1 text-sm rounded border',
            isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          )}
          aria-required="true"
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
            aria-label="New folder name"
          />
        )}
        {error && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => {
              onClose();
              clearError();
            }}
            className={clsx(
              'px-4 py-1 text-sm rounded transition-all',
              isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
            )}
            disabled={isSaving}
            aria-label="Cancel bookmark"
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
            aria-label="Save bookmark"
          >
            {isSaving ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(BookmarkPopup);