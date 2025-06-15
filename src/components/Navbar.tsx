import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, MinusIcon, PlusIcon, Bars3Icon } from '@heroicons/react/24/solid';
import { Config, ElectronWebview } from '../types';

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

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config: Config = await window.electronAPI.getConfig();
        const darkMode = config.itdTools.isDarkMode ?? true;
        setIsDarkMode(darkMode);
        setLocalNavColor(config.itdTools.navBackgroundColor || navColor);
        document.documentElement.classList.toggle('dark', darkMode);
        console.log('Config loaded:', { isDarkMode: darkMode, navColor: config.itdTools.navBackgroundColor });
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    };
    loadConfig();
  }, [navColor]);

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
    if (webviewRef) webviewRef.loadURL(newUrl);
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNavigate();
  };

  const handleToggleTheme = async (dark: boolean) => {
    try {
      const config = await window.electronAPI.getConfig();
      const newConfig: Config = {
        ...config,
        itdTools: { ...config.itdTools, isDarkMode: dark },
      };
      await window.electronAPI.saveConfig(newConfig);
      setIsDarkMode(dark);
      document.documentElement.classList.toggle('dark', dark);
      console.log('Theme toggled:', {
        isDarkMode: dark,
        theme: dark ? 'dark' : 'light',
        documentClasses: document.documentElement.classList.toString(),
      });
    } catch (err) {
      console.error('Failed to toggle theme:', err);
    }
  };

  const handleChangeNavColor = async (color: string) => {
    try {
      const config = await window.electronAPI.getConfig();
      const newConfig: Config = {
        ...config,
        itdTools: { ...config.itdTools, navBackgroundColor: color },
      };
      await window.electronAPI.saveConfig(newConfig);
      setLocalNavColor(color);
      console.log('Nav color changed to:', color);
    } catch (err) {
      console.error('Failed to change nav color:', err);
    }
  };

  const renderCustomizePanel = () => {
    const root = document.getElementById('customize-spartan-root');
    if (!root) {
      console.error('Customize Spartan root div not found');
      return null;
    }

    console.log('Rendering Customize Spartan panel');

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
              onClick={() => handleToggleTheme(true)}
              className={clsx(
                'flex items-center justify-center w-1/2 py-3 rounded-full transition-all text-lg',
                isDarkMode ? `bg-${navColor}-600 text-white` : 'bg-transparent text-gray-300 dark:text-gray-600 hover:bg-gray-300 dark:hover:bg-gray-400'
              )}
            >
              <span className="text-2xl mr-2">☀️</span> Light
            </button>
            <button
              onClick={() => handleToggleTheme(false)}
              className={clsx(
                'flex items-center justify-center w-1/2 py-3 rounded-full transition-all text-lg',
                !isDarkMode ? `bg-${navColor}-600 text-white` : 'bg-transparent text-gray-300 dark:text-gray-600 hover:bg-gray-300 dark:hover:bg-gray-400'
              )}
            >
              <span className="text-2xl mr-2">🌙</span> Dark
            </button>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-base font-medium text-white dark:text-gray-900 mb-2">Interface Palette</h3>
            <div className="flex flex-wrap justify-center items-center gap-1 rounded-full bg-gray-700/50 dark:bg-gray-200/50 backdrop-blur-sm shadow-inner p-2 w-96">
              <button
                onClick={() => handleChangeNavColor('purple')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-purple-600 hover:bg-purple-700',
                  localNavColor === 'purple' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Purple"
              />
              <button
                onClick={() => handleChangeNavColor('red')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-red-600 hover:bg-red-700',
                  localNavColor === 'red' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Red"
              />
              <button
                onClick={() => handleChangeNavColor('orange')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-orange-600 hover:bg-orange-700',
                  localNavColor === 'orange' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Orange"
              />
              <button
                onClick={() => handleChangeNavColor('green')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-green-600 hover:bg-green-700',
                  localNavColor === 'green' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Green"
              />
              <button
                onClick={() => handleChangeNavColor('yellow')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-yellow-600 hover:bg-yellow-700',
                  localNavColor === 'yellow' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Yellow"
              />
              <button
                onClick={() => handleChangeNavColor('blue')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-blue-600 hover:bg-blue-700',
                  localNavColor === 'blue' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Blue"
              />
              <button
                onClick={() => handleChangeNavColor('pink')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-pink-600 hover:bg-pink-700',
                  localNavColor === 'pink' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Pink"
              />
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
        <div className="flex-1 flex justify-center min-w-0">
          <input
            ref={addressInput}
            defaultValue={url}
            onKeyDown={handleEnter}
            className={clsx(
              'max-w-6xl mx-auto w-full px-4 py-2 text-base rounded-full border shadow-sm focus:outline-none focus:ring-2',
              isDarkMode
                ? `bg-gray-800 border-gray-700 text-white placeholder-gray-300 focus:ring-${navColor}-300`
                : `bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-${navColor}-500`
            )}
            placeholder="Enter URL..."
          />
        </div>
        <div className="flex items-center gap-1 ml-auto mr-6">
          <div className="flex items-center gap-1">
            <button
              ref={customizeButtonRef}
              onClick={() => setCustomizeOpen(!customizeOpen)}
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
      {customizeOpen && renderCustomizePanel()}
    </div>
  );
};

export default Navbar;