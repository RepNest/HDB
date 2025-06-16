import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, MinusIcon, PlusIcon, Bars3Icon } from '@heroicons/react/24/solid';
import { Config, ElectronWebview, Tab } from '../types';
import CustomizeSpartanPanel from './CustomizeSpartanPanel';
import BookmarkPopup from './BookmarkPopup';

interface NavbarProps {
  webviewRef: ElectronWebview | null;
  url: string;
  onNavigate: (url: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  zoomLevel: number;
  onNewTab: (url: string) => void;
  onNewWindow: () => void;
  onNewPrivateWindow: () => void;
  zoom: number;
  navColor: string;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  setCustomizeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pinnedTabs: Tab[]; // Added pinnedTabs
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
  navColor,
  config,
  setConfig,
  setCustomizeOpen,
  pinnedTabs,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [customizeOpen, setLocalCustomizeOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const addressInput = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const customizeButtonRef = useRef<HTMLButtonElement>(null);
  const starButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDarkMode(config.itdTools.isDarkMode ?? true);
  }, [config.itdTools.isDarkMode]);

  useEffect(() => {
    setCustomizeOpen(customizeOpen);
  }, [customizeOpen, setCustomizeOpen]);

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
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        starButtonRef.current &&
        !starButtonRef.current.contains(e.target as Node)
      ) {
        setPopupOpen(false);
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
    if (webviewRef) webviewRef.loadURL(newUrl);
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNavigate();
  };

  return (
    <div
      className={clsx(
        'flex items-center pt-1 pr-1 pb-3 pl-1 shadow-md relative z-[1000] w-full',
        `bg-${navColor}-600 dark:bg-${navColor}-300`
      )}
      style={{ width: '100%' }}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => webviewRef?.loadURL('https://miamidadecounty.sharepoint.com/sites/ITServiceDesk')}
          className={clsx(
            'w-10 h-10 flex items-center justify-center rounded-full transition-all',
            isDarkMode
              ? 'text-white hover:bg-gray-800 fill-white'
              : 'text-gray-900 hover:bg-gray-200 fill-gray-900'
          )}
          title="Home"
        >
          <span className="text-2xl">🏠</span>
        </button>
      </div>
      <div className="flex-1 flex items-center gap-1 ml-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => webviewRef?.goBack()}
            className={clsx(
              'w-10 h-10 flex items-center justify-center rounded-full transition-all',
              isDarkMode
                ? 'text-white hover:bg-gray-800 fill-white'
                : 'text-gray-900 hover:bg-gray-200 fill-gray-900'
            )}
            title="Back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => webviewRef?.goForward()}
            className={clsx(
              'w-10 h-10 flex items-center justify-center rounded-full transition-all',
              isDarkMode
                ? 'text-white hover:bg-gray-800 fill-white'
                : 'text-gray-900 hover:bg-gray-200 fill-gray-900'
            )}
            title="Forward"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => webviewRef?.reload()}
            className={clsx(
              'w-10 h-10 flex items-center justify-center rounded-full transition-all',
              isDarkMode
                ? 'text-white hover:bg-gray-800 fill-white'
                : 'text-gray-900 hover:bg-gray-200 fill-gray-900'
            )}
            title="Reload"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex justify-center min-w-0 relative">
          <div className="relative w-full max-w-6xl">
            <input
              ref={addressInput}
              defaultValue={url}
              onKeyDown={handleEnter}
              className={clsx(
                'w-full px-4 py-2 pr-10 text-base rounded-full border shadow-sm focus:outline-none focus:ring-2',
                isDarkMode
                  ? `bg-gray-800 border-gray-700 text-white placeholder-gray-300 focus:ring-${navColor}-300`
                  : `bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-${navColor}-500`
              )}
              placeholder="Enter URL..."
            />
            <button
              ref={starButtonRef}
              onClick={() => setPopupOpen(!popupOpen)}
              className={clsx(
                'absolute right-3 top-1/2 transform -translate-y-1/2 text-xl transition-all duration-200',
                isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-500'
              )}
              title="Save as Favorite"
            >
              ⭐
            </button>
            <AnimatePresence>
              {popupOpen && (
                <div ref={popupRef}>
                  <BookmarkPopup
                    isOpen={popupOpen}
                    onClose={() => setPopupOpen(false)}
                    url={url}
                    webviewRef={webviewRef}
                    config={config}
                    setConfig={setConfig}
                    isDarkMode={isDarkMode}
                    position={{
                      top: 'calc(100% + 4px)',
                      right:
                        addressInput.current && starButtonRef.current
                          ? addressInput.current.offsetWidth -
                            starButtonRef.current.offsetLeft -
                            starButtonRef.current.offsetWidth
                          : 0,
                    }}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-auto mr-6">
          <div className="flex items-center gap-1">
            <button
              ref={customizeButtonRef}
              onClick={() => setLocalCustomizeOpen(!customizeOpen)}
              className={clsx(
                'w-10 h-10 flex items-center justify-center rounded-full transition-all',
                isDarkMode
                  ? 'text-white hover:bg-gray-800 fill-white'
                  : 'text-gray-900 hover:bg-gray-200 fill-gray-900'
              )}
              title="Customize Spartan"
            >
              <span className="text-2xl">✏️</span>
            </button>
            <button
              onClick={onZoomOut}
              className={clsx(
                'w-10 h-10 flex items-center justify-center rounded-full transition-all',
                isDarkMode
                  ? 'text-white hover:bg-gray-800 fill-white'
                  : 'text-gray-900 hover:bg-gray-200 fill-gray-900'
              )}
              title="Zoom out"
            >
              <MinusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onResetZoom}
              className={clsx(
                'px-4 py-2 text-xl rounded-lg shadow-sm border transition-all',
                isDarkMode
                  ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
              )}
              title="Reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={onZoomIn}
              className={clsx(
                'w-10 h-10 flex items-center justify-center rounded-full transition-all',
                isDarkMode
                  ? 'text-white hover:bg-gray-800 fill-white'
                  : 'text-gray-900 hover:bg-gray-200 fill-gray-900'
              )}
              title="Zoom in"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className={clsx(
              'w-10 h-10 flex items-center justify-center rounded-full transition-all',
              isDarkMode
                ? 'text-white hover:bg-gray-800 fill-white'
                : 'text-gray-900 hover:bg-gray-200 fill-gray-900'
            )}
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
                className={clsx(
                  'absolute border rounded-lg shadow-md p-2 z-[1000]',
                  isDarkMode
                    ? 'bg-neutral-900 border-gray-700 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-900'
                )}
                style={{
                  top: menuButtonRef.current ? menuButtonRef.current.getBoundingClientRect().bottom + 4 : 0,
                  right: 16,
                  minWidth: '20rem',
                }}
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => {
                      onNewTab('https://www.google.com');
                      setMenuOpen(false);
                    }}
                    className={clsx(
                      'px-4 py-2 text-lg text-left rounded shadow-sm border transition-all',
                      isDarkMode
                        ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
                    )}
                  >
                    Open a new tab
                  </button>
                  <button
                    onClick={() => {
                      onNewWindow();
                      setMenuOpen(false);
                    }}
                    className={clsx(
                      'px-4 py-2 text-lg text-left rounded shadow-sm border transition-all',
                      isDarkMode
                        ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
                    )}
                  >
                    New window
                  </button>
                  <button
                    onClick={() => {
                      onNewPrivateWindow();
                      setMenuOpen(false);
                    }}
                    className={clsx(
                      'px-4 py-2 text-lg text-left rounded shadow-sm border transition-all',
                      isDarkMode
                        ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
                    )}
                  >
                    New private window
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {customizeOpen && (
        <CustomizeSpartanPanel
          isOpen={customizeOpen}
          toggle={() => setLocalCustomizeOpen(false)}
          config={config}
          setConfig={setConfig}
          pinnedTabs={pinnedTabs} // Fixed: Added pinnedTabs
        />
      )}
    </div>
  );
};

export default Navbar;