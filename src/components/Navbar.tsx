import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, MinusIcon, PlusIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { ElectronWebview, Tab } from '../types';
import CustomizeSpartanPanel from './CustomizeSpartanPanel';
import BookmarkPopup from './BookmarkPopup';
import { useConfig } from './ConfigContext';
import { saveHistory, getHistory, filterHistory } from '../utils/history';

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
  setCustomizeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pinnedTabs: Tab[];
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
  setCustomizeOpen,
  pinnedTabs,
}) => {
  const { config } = useConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customizeOpen, setLocalCustomizeOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const [addressValue, setAddressValue] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [history, setHistory] = useState(config.history);
  const addressInput = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const customizeButtonRef = useRef<HTMLButtonElement>(null);
  const starButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDarkMode(config.itdTools.isDarkMode ?? true);
  }, [config.itdTools.isDarkMode]);

  useEffect(() => {
    setCustomizeOpen(customizeOpen);
  }, [customizeOpen, setCustomizeOpen]);

  useEffect(() => {
    setAddressValue(url);
  }, [url]);

  useEffect(() => {
    const loadHistory = async () => {
      const fetchedHistory = await getHistory();
      setHistory(fetchedHistory);
    };
    loadHistory();
  }, []);

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
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        addressInput.current &&
        !addressInput.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sanitizeUrl = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const dangerousProtocols = /^(javascript|data|vbscript):/i;
    if (dangerousProtocols.test(trimmed)) return null;
    const urlRegex = /^(https?:\/\/|file:\/\/)/i;
    return urlRegex.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const suggestions = useMemo(() => {
    return filterHistory(addressValue, history, config.favorites);
  }, [addressValue, history, config.favorites]);

  const handleNavigate = useCallback(() => {
    if (!addressInput.current) return;
    const newUrl = sanitizeUrl(addressInput.current.value);
    if (!newUrl) {
      setAddressValue('');
      return;
    }
    try {
      new URL(newUrl);
      setIsLoading(true);
      onNavigate(newUrl);
      if (webviewRef) {
        webviewRef.loadURL(newUrl);
        webviewRef.addEventListener('did-finish-load' as any, () => setIsLoading(false), { once: true });
        webviewRef.addEventListener('did-fail-load', () => setIsLoading(false), { once: true });
      }
      saveHistory(newUrl, history).then(() => {
        getHistory().then(setHistory);
      });
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } catch {
      console.warn('Invalid URL:', newUrl);
      setIsLoading(false);
    }
  }, [onNavigate, webviewRef, history]);

  const handleEnter = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && selectedSuggestionIndex === -1) {
        handleNavigate();
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        const suggestion = suggestions[selectedSuggestionIndex];
        setAddressValue(suggestion.url);
        handleNavigate();
      } else if (e.key === 'ArrowDown' && showSuggestions) {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp' && showSuggestions) {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    },
    [handleNavigate, selectedSuggestionIndex, showSuggestions, suggestions]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleClearInput = () => {
    setAddressValue('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    addressInput.current?.focus();
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
          aria-label="Go to IT Service Desk"
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
            aria-label="Go back"
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
            aria-label="Go forward"
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
            aria-label="Reload page"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex justify-center min-w-0 relative">
          <div className="relative w-full max-w-6xl">
            <input
              ref={addressInput}
              value={addressValue}
              onChange={handleInputChange}
              onKeyDown={handleEnter}
              onFocus={() => setShowSuggestions(true)}
              className={clsx(
                'w-full px-4 py-2 pr-16 text-base rounded-full border shadow-sm focus:outline-none focus:ring-2 transition-all duration-200',
                isDarkMode
                  ? `bg-gray-800 border-gray-700 text-white placeholder-gray-300 focus:ring-${navColor}-300`
                  : `bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-${navColor}-500`,
                'animate-pulse-focus'
              )}
              placeholder="Enter URL..."
              aria-label="Enter URL to navigate"
              aria-controls="suggestions-list"
              aria-activedescendant={
                selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined
              }
            />
            {addressValue && (
              <button
                onClick={handleClearInput}
                className={clsx(
                  'absolute right-10 top-1/2 transform -translate-y-1/2 text-sm transition-all duration-200',
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'
                )}
                title="Clear address bar"
                aria-label="Clear address bar"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
            {isLoading && (
              <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}
            <button
              ref={starButtonRef}
              onClick={() => setPopupOpen(!popupOpen)}
              className={clsx(
                'absolute right-3 top-1/2 transform -translate-y-1/2 text-xl transition-all duration-200',
                isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-500'
              )}
              title="Save as Favorite"
              aria-label="Save as favorite"
            >
              ⭐
            </button>
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  ref={suggestionsRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={clsx(
                    'absolute top-full left-0 mt-1 w-full max-w-6xl rounded-lg shadow-md z-[1000] max-h-64 overflow-y-auto',
                    isDarkMode ? 'bg-neutral-900 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                  )}
                  id="suggestions-list"
                  role="listbox"
                >
                  {suggestions.map((item, index) => (
                    <div
                      key={`${item.url}-${index}`}
                      id={`suggestion-${index}`}
                      className={clsx(
                        'px-4 py-2 text-sm cursor-pointer transition-all',
                        selectedSuggestionIndex === index
                          ? 'bg-gray-600'
                          : isDarkMode
                          ? 'hover:bg-gray-800'
                          : 'hover:bg-gray-200'
                      )}
                      onClick={() => {
                        setAddressValue(item.url);
                        handleNavigate();
                      }}
                      role="option"
                      aria-selected={selectedSuggestionIndex === index}
                    >
                      <span className="truncate">{item.url}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {popupOpen && (
                <div ref={popupRef}>
                  <BookmarkPopup
                    isOpen={popupOpen}
                    onClose={() => setPopupOpen(false)}
                    url={addressValue}
                    webviewRef={webviewRef}
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
              aria-label="Customize Spartan"
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
              aria-label="Zoom out"
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
              aria-label={`Reset zoom to ${Math.round(zoomLevel * 100)}%`}
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
              aria-label="Zoom in"
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
            aria-label="Open more options menu"
            aria-expanded={menuOpen}
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
                role="menu"
                aria-label="More options menu"
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
                    role="menuitem"
                    aria-label="Open a new tab"
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
                    role="menuitem"
                    aria-label="Open new window"
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
                    role="menuitem"
                    aria-label="Open new private window"
                  >
                    New private window
                  </button>
                  <button
                    onClick={() => {
                      onNewTab('spartan://history');
                      setMenuOpen(false);
                    }}
                    className={clsx(
                      'px-4 py-2 text-lg text-left rounded shadow-sm border transition-all',
                      isDarkMode
                        ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
                    )}
                    role="menuitem"
                    aria-label="Open history page"
                  >
                    History
                  </button>
                  <button
                    onClick={() => {
                      setLocalCustomizeOpen(true);
                      setMenuOpen(false);
                    }}
                    className={clsx(
                      'px-4 py-2 text-lg text-left rounded shadow-sm border transition-all',
                      isDarkMode
                        ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
                    )}
                    role="menuitem"
                    aria-label="Open settings panel"
                  >
                    Settings
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
          pinnedTabs={pinnedTabs}
        />
      )}
    </div>
  );
};

export default React.memo(Navbar);