import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

type Favorite = {
  favicon?: string;
  name: string;
  url: string;
};

type FolderedFavorites = {
  [folder: string]: Favorite[];
};

type Props = {
  favorites: FolderedFavorites;
  onFavoriteClick: (url: string) => void;
  onFavoriteDelete: (name: string, folder?: string) => void;
  onFolderRename: (oldName: string, newName: string) => void;
  onFolderDelete: (folderName: string) => void;
};

const FavoritesBar: React.FC<Props> = ({
  favorites,
  onFavoriteClick,
  onFavoriteDelete,
  onFolderRename,
  onFolderDelete
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [folderContext, setFolderContext] = useState<{ x: number; y: number; folder: string } | null>(null);
  const [favoriteContext, setFavoriteContext] = useState<{ x: number; y: number; fav: Favorite; folder?: string } | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [moreButtonPos, setMoreButtonPos] = useState<{ top: number; left: number } | null>(null);

  const barRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const portalRoot = document.getElementById('portal-root');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        setFolderContext(null);
        setFavoriteContext(null);
      }
      if (!target.closest('.dropdown-content') && !target.closest('.overflow-button')) {
        setActiveDropdown(null);
        setShowOverflowMenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFolderContext(null);
        setFavoriteContext(null);
        setActiveDropdown(null);
        setShowOverflowMenu(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const checkOverflow = () => {
    return barRef.current?.scrollWidth > barRef.current?.clientWidth;
  };

  const visibleFolders = Object.entries(favorites).filter(([k]) => k !== ' ');
  const topLevelFavorites = favorites[' '] || [];

  const handleFolderClick = (e: React.MouseEvent<HTMLButtonElement>, folder: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveDropdown(activeDropdown === folder ? null : folder);
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
  };

  const handleFolderRightClick = (e: React.MouseEvent, folder: string) => {
    e.preventDefault();
    setFolderContext({ x: e.clientX, y: e.clientY, folder });
  };

  const handleFavoriteRightClick = (e: React.MouseEvent, fav: Favorite, folder?: string) => {
    e.preventDefault();
    setFavoriteContext({ x: e.clientX, y: e.clientY, fav, folder });
  };

  const handleFolderDelete = () => {
    if (folderContext) {
      onFolderDelete(folderContext.folder);
      setFolderContext(null);
    }
  };

  const handleFavoriteDelete = () => {
    if (favoriteContext) {
      onFavoriteDelete(favoriteContext.fav.name, favoriteContext.folder);
      setFavoriteContext(null);
    }
  };

  const startRenaming = () => {
    if (!folderContext) return;
    setRenamingFolder(folderContext.folder);
    setRenameInput(folderContext.folder);
    setFolderContext(null);
  };

  const confirmRename = () => {
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

  const handleMoreClick = () => {
    const rect = moreButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setMoreButtonPos({ top: rect.bottom + 4, left: rect.left });
    }
    setShowOverflowMenu(!showOverflowMenu);
  };

  return (
    <>
      <div ref={barRef} className="relative bg-neutral-900 px-4 py-2 flex gap-2 overflow-x-auto z-40">
        {topLevelFavorites.map((fav, idx) => (
          <div
            key={idx}
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-2 cursor-pointer"
            onClick={() => onFavoriteClick(fav.url)}
            onContextMenu={(e) => handleFavoriteRightClick(e, fav)}
            title={fav.name}
          >
            {fav.favicon && <img src={fav.favicon} className="w-4 h-4" alt="" />}
            {fav.name}
          </div>
        ))}

        {visibleFolders.map(([folder, favs]) => (
          <div key={folder} className="relative z-50">
            <button
              onClick={(e) => handleFolderClick(e, folder)}
              onContextMenu={(e) => handleFolderRightClick(e, folder)}
              className={`px-4 py-1 rounded flex items-center gap-2 ${
                activeDropdown === folder ? 'bg-yellow-600' : 'bg-neutral-800'
              } hover:bg-neutral-700 text-white`}
              title={folder}
            >
              📁{' '}
              {renamingFolder === folder ? (
                <input
                  autoFocus
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename();
                    if (e.key === 'Escape') setRenamingFolder(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="text-black px-1 py-0.5 rounded text-sm w-28"
                />
              ) : (
                folder
              )}
            </button>

            {activeDropdown === folder && dropdownPos && portalRoot &&
              ReactDOM.createPortal(
                <div
                  className="dropdown-content absolute bg-white text-black shadow-lg rounded w-56 max-h-80 overflow-y-auto z-[100]"
                  style={{
                    position: 'fixed',
                    top: dropdownPos.top,
                    left: dropdownPos.left
                  }}
                >
                  {favs.map((fav, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        onFavoriteClick(fav.url);
                        setActiveDropdown(null);
                      }}
                      onContextMenu={(e) => handleFavoriteRightClick(e, fav, folder)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      title={fav.url}
                    >
                      {fav.favicon && (
                        <img
                          src={fav.favicon}
                          alt=""
                          className="w-4 h-4"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                        />
                      )}
                      {fav.name}
                    </div>
                  ))}
                </div>,
                portalRoot
              )}
          </div>
        ))}

        {checkOverflow() && (
          <button
            ref={moreButtonRef}
            onClick={handleMoreClick}
            className="overflow-button px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-white"
            title="More"
          >
            &gt;
          </button>
        )}
      </div>

      {showOverflowMenu && moreButtonPos && portalRoot &&
        ReactDOM.createPortal(
          <div
            className="dropdown-content absolute bg-white text-black shadow-lg rounded w-60 max-h-96 overflow-y-auto z-[200]"
            style={{
              position: 'fixed',
              top: moreButtonPos.top,
              left: moreButtonPos.left
            }}
          >
            <div className="px-2 py-1 text-xs text-gray-500">Overflow Items</div>
            {topLevelFavorites.map((fav, idx) => (
              <div
                key={`more-fav-${idx}`}
                onClick={() => {
                  onFavoriteClick(fav.url);
                  setShowOverflowMenu(false);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              >
                {fav.favicon && <img src={fav.favicon} className="w-4 h-4" />}
                {fav.name}
              </div>
            ))}
            {visibleFolders.map(([folder]) => (
              <div
                key={`more-folder-${folder}`}
                onClick={(e) => {
                  setActiveDropdown(folder);
                  handleMoreClick();
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                📁 {folder}
              </div>
            ))}
          </div>,
          portalRoot
        )}

      {folderContext && (
        <ul
          className="context-menu fixed z-[300] bg-white text-black rounded shadow-md w-40"
          style={{ top: folderContext.y, left: folderContext.x }}
        >
          <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer" onClick={startRenaming}>
            Rename Folder
          </li>
          <li className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer" onClick={handleFolderDelete}>
            Delete Folder
          </li>
        </ul>
      )}

      {favoriteContext && (
        <ul
          className="context-menu fixed z-[300] bg-white text-black rounded shadow-md w-48"
          style={{ top: favoriteContext.y, left: favoriteContext.x }}
        >
          <li
            className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
            onClick={() => {
              onFavoriteClick(favoriteContext.fav.url);
              setFavoriteContext(null);
            }}
          >
            Open in New Tab
          </li>
          <li
            className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
            onClick={() => {
              navigator.clipboard.writeText(favoriteContext.fav.url);
              setFavoriteContext(null);
            }}
          >
            Copy Link Address
          </li>
          <li className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer" onClick={handleFavoriteDelete}>
            Delete Favorite
          </li>
        </ul>
      )}
    </>
  );
};

export default FavoritesBar;
