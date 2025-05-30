import React, { useState, useEffect, useRef } from 'react';

type Favorite = {
  favicon: any;
  name: string;
  url: string;
};

type FolderedFavorites = {
  [folder: string]: Favorite[];
};

type Props = {
  favorites: FolderedFavorites;
  onFavoriteClick: (url: string) => void;
  onFolderRename: (oldName: string, newName: string) => void;
  onFolderDelete: (folderName: string) => void;
};

const FavoritesBar: React.FC<Props> = ({
  favorites,
  onFavoriteClick,
  onFolderRename,
  onFolderDelete
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folder: string } | null>(
    null
  );
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setActiveDropdown(null);
      }
      if (contextRef.current && !contextRef.current.contains(target)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRightClick = (e: React.MouseEvent, folder: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, folder });
  };

  const startRenaming = () => {
    if (!contextMenu) return;
    setRenameInput(contextMenu.folder);
    setRenamingFolder(contextMenu.folder);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (contextMenu && window.confirm(`Delete folder "${contextMenu.folder}"?`)) {
      onFolderDelete(contextMenu.folder);
    }
    setContextMenu(null);
  };

  const handleRenameConfirm = () => {
    const trimmed = renameInput.trim();
    if (
      renamingFolder &&
      trimmed &&
      trimmed !== renamingFolder &&
      !favorites[trimmed]
    ) {
      onFolderRename(renamingFolder, trimmed);
    }
    setRenamingFolder(null);
  };

  return (
    <>
      <div className="relative bg-neutral-900 px-4 py-2 flex gap-2">
        {Object.entries(favorites).map(([folder, favs]) => (
          <div key={folder} className="relative">
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === folder ? null : folder)
              }
              onContextMenu={(e) => handleRightClick(e, folder)}
              className={`px-4 py-1 rounded flex items-center gap-2 ${
                activeDropdown === folder ? 'bg-yellow-600' : 'bg-neutral-800'
              } hover:bg-neutral-700 text-white`}
            >
              📁{' '}
              {renamingFolder === folder ? (
                <input
                  autoFocus
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameConfirm();
                    if (e.key === 'Escape') setRenamingFolder(null);
                  }}
                  className="text-black px-1 py-0.5 rounded text-sm w-28"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                folder
              )}
            </button>

            {activeDropdown === folder && (
              <div
                ref={dropdownRef}
                className="absolute left-0 top-full mt-1 w-56 bg-white text-black rounded shadow-lg z-50"
              >
                {favs.map((fav, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      onFavoriteClick(fav.url);
                      setActiveDropdown(null);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    title={fav.url}
                  >
                    {fav.favicon && (
                      <img
                        src={fav.favicon}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {fav.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {contextMenu && (
        <ul
          ref={contextRef}
          className="context-menu fixed z-50 bg-white text-black rounded shadow-md w-40"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <li
            className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
            onClick={startRenaming}
          >
            Rename Folder
          </li>
          <li
            className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer"
            onClick={handleDelete}
          >
            Delete Folder
          </li>
        </ul>
      )}
    </>
  );
};

export default FavoritesBar;
