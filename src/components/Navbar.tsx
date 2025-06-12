import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  webviewRef: React.RefObject<any>;
  url: string;
  onNavigate: (url: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  zoomLevel: number;
  onNewTab: () => void;
  onNewWindow: () => void;
  onNewPrivateWindow: () => void;
  zoom: number;
}

const Navbar: React.FC<NavbarProps> = ({
  webviewRef,
  url,
  onNavigate,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  zoomLevel,
  onNewTab,
  onNewWindow,
  onNewPrivateWindow,
  zoom,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const addressInput = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = () => {
    if (!addressInput.current) return;
    let newUrl = addressInput.current.value;
    if (!newUrl.startsWith('http')) newUrl = 'https://' + newUrl;
    onNavigate(newUrl);
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNavigate();
  };

  return (
    <div
      className="flex items-center bg-gradient-to-r from-purple-800 to-indigo-900 p-1 shadow-md"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => webviewRef.current?.loadURL('https://miamidadecounty.sharepoint.com/sites/ITServiceDesk')}
          className="px-4 py-2 text-lg bg-gray-800 text-white rounded hover:bg-gray-700 shadow-md border-2 border-gray-600"
        >
          🏠
        </button>
      </div>
      <div className="flex-1 flex items-center gap-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => webviewRef.current?.goBack()}
            className="px-4 py-2 text-lg bg-gray-800 text-white rounded hover:bg-gray-700 shadow-md border-2 border-gray-600"
          >
            ←
          </button>
          <button
            onClick={() => webviewRef.current?.goForward()}
            className="px-4 py-2 text-lg bg-gray-800 text-white rounded hover:bg-gray-700 shadow-md border-2 border-gray-600"
          >
            →
          </button>
          <button
            onClick={() => webviewRef.current?.reload()}
            className="px-4 py-2 text-lg bg-gray-800 text-white rounded hover:bg-gray-700 shadow-md border-2 border-gray-600"
          >
            ⟳
          </button>
        </div>
        <div className="flex-1 flex justify-center min-w-0">
          <input
            ref={addressInput}
            defaultValue={url}
            onKeyDown={handleEnter}
            className="max-w-6xl mx-auto w-full px-4 py-2 text-base rounded-full bg-gray-800 border border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-white"
          />
        </div>
        <div className="flex items-center gap-1 ml-auto mr-6">
          <div className="flex items-center gap-2">
            <button
              onClick={onZoomOut}
              className="px-4 py-2 text-xl bg-gray-900 text-white rounded-lg hover:bg-gray-800 shadow-sm border border-gray-700"
              title="Zoom out"
            >
              −
            </button>
            <button
              onClick={onResetZoom}
              className="px-4 py-2 text-xl bg-gray-900 text-white rounded-lg hover:bg-gray-800 shadow-sm border border-gray-700"
              title="Reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={onZoomIn}
              className="px-4 py-2 text-xl bg-gray-900 text-white rounded-lg hover:bg-gray-800 shadow-sm border border-gray-700"
              title="Zoom in"
            >
              +
            </button>
          </div>
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className="px-4 py-2 text-xl bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-sm border border-gray-700"
            title="More options"
          >
            ⋮
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute bg-gray-900 border border-gray-700 rounded-lg shadow-md p-2 z-50"
                style={{
                  top: menuButtonRef.current ? menuButtonRef.current.getBoundingClientRect().bottom + 4 : 0,
                  right: 16,
                  minWidth: '20rem',
                }}
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => {
                      onNewTab();
                      setMenuOpen(false);
                    }}
                    className="px-4 py-2 text-lg text-left text-white hover:bg-gray-800 rounded shadow-sm border border-gray-700"
                  >
                    Open a new tab
                  </button>
                  <button
                    onClick={() => {
                      onNewWindow();
                      setMenuOpen(false);
                    }}
                    className="px-4 py-2 text-lg text-left text-white hover:bg-gray-800 rounded shadow-sm border border-gray-700"
                  >
                    New window
                  </button>
                  <button
                    onClick={() => {
                      onNewPrivateWindow();
                      setMenuOpen(false);
                    }}
                    className="px-4 py-2 text-lg text-left text-white hover:bg-gray-800 rounded shadow-sm border border-gray-700"
                  >
                    New private window
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Navbar;