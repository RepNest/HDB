import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, MinusIcon, PlusIcon, Bars3Icon } from '@heroicons/react/24/solid';

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
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const addressInput = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const customizeButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const customizeRef = useRef<HTMLDivElement>(null);

  // Create a root div for the customize panel
  useEffect(() => {
    let root = document.getElementById('customize-spartan-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'customize-spartan-root';
      document.body.appendChild(root);
    }
    return () => {
      if (root && !customizeOpen) {
        document.body.removeChild(root);
      }
    };
  }, [customizeOpen]);

  // Close menu and customize panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
      if (
        customizeRef.current &&
        !customizeRef.current.contains(e.target as Node) &&
        customizeButtonRef.current &&
        !customizeButtonRef.current.contains(e.target as Node)
      ) {
        setCustomizeOpen(false);
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

  // Render the customize panel in the root div
  const renderCustomizePanel = () => {
    const root = document.getElementById('customize-spartan-root');
    if (!root) return null;

    return (
      <motion.div
        ref={customizeRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute bg-gray-900 border border-gray-700 rounded-md shadow-md p-4 z-[10000]"
        style={{
          top: 60, // Height of navbar (~40px) + favorites bar (~20px)
          right: customizeButtonRef.current
            ? window.innerWidth - customizeButtonRef.current.getBoundingClientRect().right + 16
            : 16,
          minWidth: '20rem',
        }}
      >
        <h2 className="text-lg font-semibold text-white mb-2">Customize Spartan</h2>
        <p className="text-white">Customization options will be added here.</p>
      </motion.div>
    );
  };

  return (
    <div
      className="flex items-center bg-gradient-to-r from-purple-800 to-indigo-900 p-1 shadow-md relative z-[1000]"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => webviewRef.current?.loadURL('https://miamidadecounty.sharepoint.com/sites/ITServiceDesk')}
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 hover:shadow-md rounded-full transition-all"
          title="Home"
        >
          <span className="text-2xl">🏠</span>
        </button>
      </div>
      <div className="flex-1 flex items-center gap-1 ml-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => webviewRef.current?.goBack()}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 hover:shadow-md rounded-full transition-all"
            title="Back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => webviewRef.current?.goForward()}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 hover:shadow-md rounded-full transition-all"
            title="Forward"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => webviewRef.current?.reload()}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 hover:shadow-md rounded-full transition-all"
            title="Reload"
          >
            <ArrowPathIcon className="w-5 h-5" />
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
          <div className="flex items-center gap-1">
            <button
              ref={customizeButtonRef}
              onClick={() => setCustomizeOpen(!customizeOpen)}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 hover:shadow-md rounded-full transition-all"
              title="Customize Spartan"
            >
              <span className="text-2xl">✏️</span>
            </button>
            <button
              onClick={onZoomOut}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 hover:shadow-md rounded-full transition-all"
              title="Zoom out"
            >
              <MinusIcon className="w-5 h-5" />
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
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 hover:shadow-md rounded-full transition-all"
              title="Zoom in"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 hover:shadow-md rounded-full transition-all"
            title="More options"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute bg-gray-900 border border-gray-700 rounded-lg shadow-md p-2 z-[1000]"
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
      {customizeOpen && renderCustomizePanel()}
    </div>
  );
};

export default Navbar;