import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { Config, Favorites, Favorite } from '../types';
import BookmarkPopup from './BookmarkPopup';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';

interface FavoritesBarProps {
  favorites: Favorites;
  onNavigate: (url: string) => void;
  navColor: string;
  isDarkMode: boolean;
  className?: string;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  currentUrl: string;
}

const FavoritesBar: React.FC<FavoritesBarProps> = ({
  favorites,
  onNavigate,
  navColor,
  isDarkMode,
  className,
  config,
  setConfig,
  currentUrl,
}) => {
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
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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
      const faviconUrl = favorites[folder][index].favicon || '';
      if (faviconUrl) {
        const response = await fetch(faviconUrl);
        if (response.ok) {
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          const updatedFavorites = {
            ...favorites,
            [folder]: favorites[folder].map((item, i) =>
              i === index ? { ...item, favicon: dataUrl } : item
            ),
          };
          try {
            const success = await window.electronAPI.saveFavorites(updatedFavorites);
            if (success) {
              setConfig((prev) => ({
                ...prev,
                favorites: updatedFavorites,
              }));
              setFaviconCache((prev) => ({ ...prev, [url]: dataUrl }));
              return dataUrl;
            }
          } catch (err) {
            console.error('Error saving favicon:', err);
          }
          return faviconUrl;
        }
      }
    } catch (err) {
      console.warn(`Failed to load favicon for ${url}:`, err);
    }
    return '/default-favicon.png';
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
    if (!contextMenu || contextMenu.type !== 'bookmark') {
      return;
    }

    const { folder, index } = contextMenu;
    const updatedFavorites = {
      ...favorites,
      [folder]: favorites[folder].filter((_, i) => i !== index),
    };

    try {
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (success) {
        setConfig((prev) => ({
          ...prev,
          favorites: updatedFavorites,
        }));
        console.log(
          `Bookmark deleted from "${contextMenu.folder}" at ${new Date().toISOString()}`
        );
        setContextMenu(null);
      } else {
        console.error('Failed to delete bookmark');
      }
    } catch (err) {
      console.error('Error deleting bookmark:', err);
    }
  };

  const handleDeleteFolder = async () => {
    if (!contextMenu || contextMenu.type !== 'folder') return;

    if (favorites[contextMenu.folder].length > 0) {
      const confirm = window.confirm(
        `The folder "${contextMenu.folder}" contains bookmarks. Are you sure you want to delete it?`
      );
      if (!confirm) {
        setContextMenu(null);
        return;
      }
    }

    const updatedFavorites = { ...favorites };
    delete updatedFavorites[contextMenu.folder];

    try {
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (success) {
        setConfig((prev) => ({
          ...prev,
          favorites: updatedFavorites,
        }));
        console.log(
          `Folder "${contextMenu.folder}" deleted at ${new Date().toISOString()}`
        );
        setContextMenu(null);
      } else {
        console.error('Failed to delete folder');
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  };

  const handleRenameFolder = async () => {
    if (!renameFolder || !renameFolder.name) return;

    const updatedFavorites = { ...favorites };
    const bookmarks = updatedFavorites[renameFolder.folder] || [];
    delete updatedFavorites[renameFolder.folder];
    updatedFavorites[renameFolder.name] = bookmarks;

    try {
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (success) {
        setConfig((prev) => ({
          ...prev,
          favorites: updatedFavorites,
        }));
        console.log(
          `Folder renamed from "${renameFolder.folder}" to "${renameFolder.name}" at ${new Date().toISOString()}`
        );
        setRenameFolder(null);
      } else {
        console.error('Failed to rename folder');
      }
    } catch (err) {
      console.error('Error renaming folder:', err);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceFolder = result.source.droppableId;
    const destFolder = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    const updatedFavorites = { ...favorites };

    if (sourceFolder === destFolder) {
      const items = [...favorites[sourceFolder]];
      const [reorderedItem] = items.splice(sourceIndex, 1);
      items.splice(destIndex, 0, reorderedItem);
      updatedFavorites[sourceFolder] = items;
    } else {
      const sourceItems = [...favorites[sourceFolder]];
      const destItems = [...(favorites[destFolder] || [])];
      const [movedItem] = sourceItems.splice(sourceIndex, 1);
      destItems.splice(destIndex, 0, movedItem);
      updatedFavorites[sourceFolder] = sourceItems;
      updatedFavorites[destFolder] = destItems;
    }

    try {
      const success = await window.electronAPI.saveFavorites(updatedFavorites);
      if (success) {
        setConfig((prev) => ({
          ...prev,
          favorites: updatedFavorites,
        }));
        console.log(`Bookmarks reordered at ${new Date().toISOString()}`);
      } else {
        console.error('Failed to reorder bookmarks');
      }
    } catch (err) {
      console.error('Error reordering bookmarks:', err);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        className={clsx(
          'flex items-center p-2 border-b z-[800] w-full',
          isDarkMode ? `bg-${navColor}-300 border-${navColor}-400` : `bg-${navColor}-600 border-${navColor}-700`,
          className
        )}
      >
        {Object.entries(favorites).map(([folder, items]) => (
          <div key={folder} className="relative">
            {renameFolder?.folder === folder ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameFolder.name}
                onChange={(e) =>
                  setRenameFolder({ folder, name: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameFolder();
                  if (e.key === 'Escape') setRenameFolder(null);
                }}
                className={clsx(
                  'px-3 py-1 text-sm rounded border',
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                )}
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
                        bookmark: favorites[contextMenu.folder][contextMenu.index],
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
                    favorites[contextMenu.folder].forEach((item) => onNavigate(item.url));
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
            config={config}
            setConfig={setConfig}
            isDarkMode={isDarkMode}
            position={{ top: '100px', right: 100 }}
            initialName={editBookmark.bookmark.name}
            initialFolder={editBookmark.folder}
            onSave={async (newBookmark, folder) => {
              const updatedFavorites = {
                ...favorites,
                [folder]: favorites[folder].map((fav, i) =>
                  i === editBookmark.index ? newBookmark : fav
                ),
              };
              try {
                const success = await window.electronAPI.saveFavorites(updatedFavorites);
                if (success) {
                  setConfig((prev) => ({
                    ...prev,
                    favorites: updatedFavorites,
                  }));
                  console.log(
                    `Bookmark "${newBookmark.name}" updated in "${folder}" at ${new Date().toISOString()}`
                  );
                  setEditBookmark(null);
                } else {
                  console.error('Failed to update bookmark');
                }
              } catch (err) {
                console.error('Error updating bookmark:', err);
              }
            }}
          />
        )}
      </div>
    </DragDropContext>
  );
};

export default FavoritesBar;