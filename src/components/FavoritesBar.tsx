import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { Favorites, Favorite } from '../types';
import BookmarkPopup from './BookmarkPopup';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from './ConfigContext';
import { getFaviconUrl } from '../utils/favicon';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface FavoritesBarProps {
  onNavigate: (url: string) => void;
  navColor: string;
  isDarkMode: boolean;
  className?: string;
  currentUrl: string;
}

const FavoritesBar: React.FC<FavoritesBarProps> = ({
  onNavigate,
  navColor,
  isDarkMode,
  className,
  currentUrl,
}) => {
  const { config, setConfig } = useConfig();
  const { error, handleError, clearError } = useErrorHandler();
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<
    | { type: 'bookmark'; folder: string; index: number; x: number; y: number }
    | { type: 'folder'; folder: string; x: number; y: number }
    | null
  >(null);
  const [editBookmark, setEditBookmark] = useState<{
    folder: string;
    index: number;
    bookmark: Favorite;
  } | null>(null);
  const [renameFolder, setRenameFolder] = useState<{ folder: string; name: string } | null>(null);
  const [faviconCache, setFaviconCache] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
      if (renameInputRef.current && !renameInputRef.current.contains(e.target as Node)) {
        setRenameFolder(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (renameFolder) {
      renameInputRef.current?.focus();
    }
  }, [renameFolder]);

  const loadFavicon = async (url: string, folder: string, index: number): Promise<string> => {
    if (faviconCache[url]) return faviconCache[url];
    try {
      const faviconUrl = await getFaviconUrl(url);
      const updatedFavorites = {
        ...config.favorites,
        [folder]: config.favorites[folder].map((item, i) =>
          i === index ? { ...item, favicon: faviconUrl } : item
        ),
      };
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (success) {
        setConfig((prev) => ({
          ...prev,
          favorites: updatedFavorites,
        }));
        setFaviconCache((prev) => ({ ...prev, [url]: faviconUrl }));
        return faviconUrl;
      }
      throw new Error('Failed to save favicon');
    } catch (err: unknown) {
      handleError(err, `Failed to load favicon for ${url}`);
      return '/default-favicon.png';
    }
  };

  const toggleFolder = (folder: string) => {
    setOpenFolder(openFolder === folder ? null : folder);
  };

  const handleContextMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    folder: string,
    index?: number,
    type: 'bookmark' | 'folder' = 'bookmark'
  ) => {
    e.preventDefault();
    if (type === 'bookmark' && typeof index === 'number') {
      setContextMenu({ type: 'bookmark', folder, index, x: e.clientX, y: e.clientY });
    } else if (type === 'folder') {
      setContextMenu({ type: 'folder', folder, x: e.clientX, y: e.clientY });
    }
  };

  const handleDeleteBookmark = async () => {
    if (!contextMenu || contextMenu.type !== 'bookmark') return;

    const { folder, index } = contextMenu;
    try {
      const updatedFavorites = {
        ...config.favorites,
        [folder]: config.favorites[folder].filter((_, i) => i !== index),
      };
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (!success) throw new Error('Failed to delete bookmark');
      setConfig((prev) => ({
        ...prev,
        favorites: updatedFavorites,
      }));
      console.log(`Bookmark deleted from "${folder}" at ${new Date().toISOString()}`);
      setContextMenu(null);
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Error deleting bookmark');
    }
  };

  const handleDeleteFolder = async () => {
    if (!contextMenu || contextMenu.type !== 'folder') return;

    if (config.favorites[contextMenu.folder].length > 0) {
      const confirm = window.confirm(
        `The folder "${contextMenu.folder}" contains bookmarks. Are you sure you want to delete it?`
      );
      if (!confirm) {
        setContextMenu(null);
        return;
      }
    }

    try {
      const updatedFavorites = { ...config.favorites };
      delete updatedFavorites[contextMenu.folder];
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (!success) throw new Error('Failed to delete folder');
      setConfig((prev) => ({
        ...prev,
        favorites: updatedFavorites,
      }));
      console.log(`Folder "${contextMenu.folder}" deleted at ${new Date().toISOString()}`);
      setContextMenu(null);
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Error deleting folder');
    }
  };

  const handleRenameFolder = async () => {
    if (!renameFolder || !renameFolder.name) return;

    try {
      const updatedFavorites = { ...config.favorites };
      const bookmarks = updatedFavorites[renameFolder.folder] || [];
      delete updatedFavorites[renameFolder.folder];
      updatedFavorites[renameFolder.name] = bookmarks;
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (!success) throw new Error('Failed to rename folder');
      setConfig((prev) => ({
        ...prev,
        favorites: updatedFavorites,
      }));
      console.log(`Folder renamed from "${renameFolder.folder}" to "${renameFolder.name}" at ${new Date().toISOString()}`);
      setRenameFolder(null);
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Error renaming folder');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceFolder = result.source.droppableId;
    const destFolder = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    try {
      const updatedFavorites = { ...config.favorites };
      if (sourceFolder === destFolder) {
        const items = [...config.favorites[sourceFolder]];
        const [reorderedItem] = items.splice(sourceIndex, 1);
        items.splice(destIndex, 0, reorderedItem);
        updatedFavorites[sourceFolder] = items;
      } else {
        const sourceItems = [...config.favorites[sourceFolder]];
        const destItems = [...(config.favorites[destFolder] || [])];
        const [movedItem] = sourceItems.splice(sourceIndex, 1);
        destItems.splice(destIndex, 0, movedItem);
        updatedFavorites[sourceFolder] = sourceItems;
        updatedFavorites[destFolder] = destItems;
      }
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (!success) throw new Error('Failed to reorder bookmarks');
      setConfig((prev) => ({
        ...prev,
        favorites: updatedFavorites,
      }));
      console.log(`Bookmarks reordered at ${new Date().toISOString()}`);
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Error reordering bookmarks');
    }
  };

  const filteredFavorites = Object.entries(config.favorites).reduce((acc, [folder, items]) => {
    const filteredItems = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredItems.length > 0) {
      acc[folder] = filteredItems;
    }
    return acc;
  }, {} as Favorites);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        className={clsx(
          'flex items-center p-2 border-b z-[800] w-full',
          isDarkMode ? `bg-${navColor}-300 border-${navColor}-400` : `bg-${navColor}-600 border-${navColor}-700`,
          className
        )}
      >
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={clsx(
            'px-3 py-1 text-sm rounded border mr-2',
            isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          )}
          placeholder="Search bookmarks..."
          aria-label="Search bookmarks"
        />
        {Object.entries(searchQuery ? filteredFavorites : config.favorites).map(([folder, items]) => (
          <div key={folder} className="relative">
            {renameFolder?.folder === folder ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameFolder.name}
                onChange={(e) => setRenameFolder({ folder, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameFolder();
                  if (e.key === 'Escape') setRenameFolder(null);
                }}
                className={clsx(
                  'px-3 py-1 text-sm rounded border',
                  isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                )}
                aria-label={`Rename folder ${folder}`}
              />
            ) : (
              <button
                onClick={() => toggleFolder(folder)}
                onContextMenu={(e) => handleContextMenu(e, folder, undefined, 'folder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggleFolder(folder);
                    e.preventDefault();
                  }
                }}
                className={clsx(
                  'flex items-center px-3 py-1 rounded transition-all',
                  isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'
                )}
                tabIndex={0}
                aria-label={`Open ${folder || 'Favorites'} folder`}
                role="button"
                aria-haspopup="true"
                aria-expanded={openFolder === folder}
              >
                <span>{folder || 'Favorites'}</span>
                <ChevronDownIcon
                  className={clsx('w-4 h-4 ml-1', isDarkMode ? 'fill-white' : 'fill-gray-900')}
                />
              </button>
            )}
            {openFolder === folder && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={clsx(
                    'absolute top-full left-0 mt-1 rounded shadow-md z-[810]',
                    isDarkMode ? 'bg-neutral-900 border-gray-700' : 'bg-gray-100 border-gray-300'
                  )}
                >
                  <Droppable droppableId={folder}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {items.map((item, index) => (
                          <Draggable key={item.url} draggableId={item.url} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="group relative"
                              >
                                <button
                                  onClick={async () => {
                                    onNavigate(item.url);
                                    setOpenFolder(null);
                                  }}
                                  onContextMenu={(e) => handleContextMenu(e, folder, index, 'bookmark')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      onNavigate(item.url);
                                      setOpenFolder(null);
                                      e.preventDefault();
                                    }
                                  }}
                                  className={clsx(
                                    'block w-full text-left px-4 py-2 text-sm transition-all',
                                    isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-200',
                                    snapshot.isDragging && 'bg-gray-600',
                                    item.url === currentUrl && 'font-bold bg-gray-500'
                                  )}
                                  title={item.name}
                                  tabIndex={0}
                                  aria-label={`Navigate to ${item.name}`}
                                  role="menuitem"
                                >
                                  <img
                                    src={faviconCache[item.url] || '/default-favicon.png'}
                                    alt=""
                                    className="inline w-4 h-4 mr-2"
                                    onLoad={() => loadFavicon(item.url, folder, index)}
                                  />
                                  <span className="truncate max-w-[200px]">{item.name}</span>
                                </button>
                                <div
                                  className={clsx(
                                    'absolute hidden group-hover:block bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded shadow-md z-[830]',
                                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                                  )}
                                >
                                  {item.name}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        ))}
        {contextMenu && (
          <div
            ref={contextMenuRef}
            className={clsx(
              'absolute border rounded-lg shadow-md p-2 z-[820]',
              isDarkMode ? 'bg-neutral-900 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
            )}
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {contextMenu.type === 'bookmark' && (
              <>
                <button
                  onClick={() => {
                    if (contextMenu.index !== undefined) {
                      setEditBookmark({
                        folder: contextMenu.folder,
                        index: contextMenu.index,
                        bookmark: config.favorites[contextMenu.folder][contextMenu.index],
                      });
                      setContextMenu(null);
                    }
                  }}
                  className={clsx(
                    'block w-full text-left px-4 py-2 text-sm transition-all',
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                  )}
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteBookmark}
                  className={clsx(
                    'block w-full text-left px-4 py-2 text-sm transition-all',
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                  )}
                >
                  Delete
                </button>
              </>
            )}
            {contextMenu.type === 'folder' && (
              <>
                <button
                  onClick={() => {
                    setRenameFolder({ folder: contextMenu.folder, name: contextMenu.folder });
                    setContextMenu(null);
                  }}
                  className={clsx(
                    'block w-full text-left px-4 py-2 text-sm transition-all',
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                  )}
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    config.favorites[contextMenu.folder].forEach((item) => onNavigate(item.url));
                    setContextMenu(null);
                  }}
                  className={clsx(
                    'block w-full text-left px-4 py-2 text-sm transition-all',
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                  )}
                >
                  Open All
                </button>
                <button
                  onClick={handleDeleteFolder}
                  className={clsx(
                    'block w-full text-left px-4 py-2 text-sm transition-all',
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                  )}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
        {editBookmark && (
          <BookmarkPopup
            isOpen={true}
            onClose={() => setEditBookmark(null)}
            url={editBookmark.bookmark.url}
            webviewRef={null}
            isDarkMode={isDarkMode}
            position={{ top: '100px', right: 100 }}
            initialName={editBookmark.bookmark.name}
            initialFolder={editBookmark.folder}
            onSave={async (newBookmark, folder) => {
              try {
                const updatedFavorites = {
                  ...config.favorites,
                  [folder]: config.favorites[folder].map((fav, i) =>
                    i === editBookmark.index ? newBookmark : fav
                  ),
                };
                const success = await window.electronAPI.saveFavorites(updatedFavorites);
                if (!success) throw new Error('Failed to update bookmark');
                setConfig((prev) => ({
                  ...prev,
                  favorites: updatedFavorites,
                }));
                console.log(`Bookmark "${newBookmark.name}" updated in "${folder}" at ${new Date().toISOString()}`);
                setEditBookmark(null);
                clearError();
              } catch (err: unknown) {
                handleError(err, 'Error updating bookmark');
              }
            }}
          />
        )}
        {error && (
          <p className="text-red-500 text-xs mt-1 ml-2" role="alert">
            {error}
          </p>
        )}
      </div>
    </DragDropContext>
  );
};

export default React.memo(FavoritesBar);