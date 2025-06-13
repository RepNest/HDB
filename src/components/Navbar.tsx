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
  onNewTab: (url: string) => void; // Fix type
  onNewWindow: () => void;
  onNewPrivateWindow: () => void;
  zoom: number;
  navColor: string;
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
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [localNavColor, setLocalNavColor] = useState(navColor);
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

  // Load dark mode and nav color
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.electronAPI.getConfig();
        setIsDarkMode(config.itdTools.isDarkMode ?? true);
        setLocalNavColor(config.itdTools.navBackgroundColor || navColor);
        document.documentElement.classList.toggle('dark', config.itdTools.isDarkMode ?? true);
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    };
    loadConfig();
  }, [navColor]);

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

  const handleToggleTheme = async (dark: boolean) => {
    try {
      const config = await window.electronAPI.getConfig();
      const newConfig = {
        ...config,
        itdTools: { ...config.itdTools, isDarkMode: dark },
      };
      await window.electronAPI.saveConfig(newConfig);
      setIsDarkMode(dark);
      document.documentElement.classList.toggle('dark', dark);
    } catch (err) {
      console.error('Failed to toggle theme:', err);
    }
  };

  const handleChangeNavColor = async (color: string) => {
    try {
      const config = await window.electronAPI.getConfig();
      const newConfig = {
        ...config,
        itdTools: { ...config.itdTools, navBackgroundColor: color },
      };
      await window.electronAPI.saveConfig(newConfig);
      setLocalNavColor(color);
    } catch (err) {
      console.error('Failed to change nav color:', err);
    }
  };

  // Render the customize panel in the root div
  const renderCustomizePanel = () => {
    const root = document.getElementById('customize-spartan-root');
    if (!root) return null;

    const colors = ['purple', 'blue', 'green', 'red', 'teal'];

    return (
      <motion.div
        ref={customizeRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute bg-neutral-900 dark:bg-gray-100 border border-gray-700 dark:border-gray-300 rounded-xl shadow-md p-6 z-[10000] overflow-y-auto sidebar-scroll"
        style={{
          top: 110,
          right: customizeButtonRef.current
            ? window.innerWidth - customizeButtonRef.current.getBoundingClientRect().right + 16
            : 16,
          width: '600px',
          height: 'calc(80vh - 100px)',
        }}
      >
        <h2 className="text-lg font-semibold text-white dark:text-gray-900 mb-4">Customize Spartan</h2>
        <div className="flex flex-col items-center space-y-6">
          <div className="theme-toggle-container flex rounded-full bg-gray-700/50 dark:bg-gray-200/50 backdrop-blur-sm shadow-inner p-2 w-96">
            <button
              onClick={() => handleToggleTheme(false)}
              className={clsx(
                'flex items-center justify-center w-1/2 py-3 rounded-full transition-all text-lg',
                !isDarkMode ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-300 dark:text-gray-600 hover:bg-purple-600 dark:hover:bg-gray-400'
              )}
            >
              <span className="text-2xl mr-2">☀️</span> Light
            </button>
            <button
              onClick={() => handleToggleTheme(true)}
              className={clsx(
                'flex items-center justify-center w-1/2 py-3 rounded-full transition-all text-lg',
                isDarkMode ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-300 dark:text-gray-600 hover:bg-purple-600 dark:hover:bg-gray-400'
              )}
            >
              <span className="text-2xl mr-2">🌙</span> Dark
            </button>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-base font-medium text-white dark:text-gray-900 mb-2">Interface Color</h3>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => handleChangeNavColor(color)}
                  className={clsx(
                    `w-10 h-10 rounded-full bg-${color}-600 hover:bg-${color}-700 transition-all`,
                    localNavColor === color ? 'ring-2 ring-white dark:ring-gray-900' : ''
                  )}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className={clsx(
        'flex items-center p-1 shadow-md relative z-[1000]',
        `bg-${navColor}-600 dark:bg-${navColor}-300`
      )}
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => webviewRef.current?.loadURL('https://miamidadecounty.sharepoint.com/sites/ITServiceDesk')}
          className="w-10 h-10 flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 hover:shadow-md rounded-full transition-all"
          title="Home"
        >
          <span className="text-2xl">🏠</span>
        </button>
      </div>
      <div className="flex-1 flex items-center gap-1 ml-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => webviewRef.current?.goBack()}
            className="w-10 h-10 flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 hover:shadow-md rounded-full transition-all"
            title="Back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => webviewRef.current?.goForward()}
            className="w-10 h-10 flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 hover:shadow-md rounded-full transition-all"
            title="Forward"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => webviewRef.current?.reload()}
            className="w-10 h-10 flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 hover:shadow-md rounded-full transition-all"
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
            className="max-w-6xl mx-auto w-full px-4 py-2 text-base rounded-full bg-gray-800 dark:bg-gray-200 border border-gray-700 dark:border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-white dark:text-gray-900"
          />
        </div>
        <div className="flex items-center gap-1 ml-auto mr-6">
          <div className="flex items-center gap-1">
            <button
              ref={customizeButtonRef}
              onClick={() => setCustomizeOpen(!customizeOpen)}
              className="w-10 h-10 flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 hover:shadow-md rounded-full transition-all"
              title="Customize Spartan"
            >
              <span className="text-2xl">✏️</span>
            </button>
            <button
              onClick={onZoomOut}
              className="w-10 h-10 flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 hover:shadow-md rounded-full transition-all"
              title="Zoom out"
            >
              <MinusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onResetZoom}
              className="px-4 py-2 text-xl bg-gray-900 dark:bg-gray-300 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-400 shadow-sm border border-gray-700 dark:border-gray-300"
              title="Reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={onZoomIn}
              className="w-10 h-10 flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 hover:shadow-md rounded-full transition-all"
              title="Zoom in"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 hover:shadow-md rounded-full transition-all"
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
                className="absolute bg-neutral-900 dark:bg-gray-100 border border-gray-700 dark:border-gray-300 rounded-lg shadow-md p-2 z-[1000]"
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
                    className="px-4 py-2 text-lg text-left text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 rounded shadow-sm border border-gray-700 dark:border-gray-300"
                  >
                    Open a new tab
                  </button>
                  <button
                    onClick={() => {
                      onNewWindow();
                      setMenuOpen(false);
                    }}
                    className="px-4 py-2 text-lg text-left text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 rounded shadow-sm border border-gray-700 dark:border-gray-300"
                  >
                    New window
                  </button>
                  <button
                    onClick={() => {
                      onNewPrivateWindow();
                      setMenuOpen(false);
                    }}
                    className="px-4 py-2 text-lg text-left text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 rounded shadow-sm border border-gray-700 dark:border-gray-300"
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