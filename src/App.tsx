import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FavoritesBar from './components/FavoritesBar';
import Navbar from './components/Navbar';
import Tabs from './components/Tabs';
import clsx from 'clsx';

// Define electronAPI interface (aligned with electron.d.ts)
interface ElectronAPI {
  launchApp: (cmd: string) => void;
  getConfig: () => Promise<{
    sidebarCollapsed: boolean;
    apps: { name: string; command: string; iconPath?: string }[];
    favorites: { [key: string]: { name: string; url: string; favicon?: string }[] };
    itdTools: {
      appsOrder: string[];
      visibleApps: string[];
      buttonOrder: string[];
      visibleITDButtons: string[];
      isEditMode: boolean;
      buttonBackgroundColor: string;
      isDarkMode: boolean;
      buttonSize: 'small' | 'medium' | 'large';
    };
    history: { url: string; timestamp: string }[];
    createdAt: string;
  }>;
  saveConfig: (config: any) => Promise<boolean>;
  saveFavorites: (favorites: { [key: string]: { name: string; url: string; favicon?: string }[] }) => Promise<boolean>;
  saveHistory: (history: { url: string; timestamp: string }[]) => Promise<void>;
  getHistory: () => Promise<{ url: string; timestamp: string }[]>;
  ipc: {
    on: (channel: string, callback: (...args: any[]) => void) => void;
    off: (channel: string, callback: (...args: any[]) => void) => void;
  };
  onNewTab: (callback: (url: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

type Tab = { id: number; title: string; url: string; favicon?: string; isNew?: boolean };
type Favorite = { name: string; url: string; favicon?: string };

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, title: 'ITD Intra', url: 'https://miamidadecounty.sharepoint.com/sites/ITD-Intra', isNew: false },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [closedTabs, setClosedTabs] = useState<Tab[]>([]);
  const [favorites, setFavorites] = useState<{ [key: string]: Favorite[] }>({});
  const [scale, setScale] = useState(1.0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const webviews: Record<number, React.RefObject<any>> = {};

  tabs.forEach(tab => {
    if (!webviews[tab.id]) webviews[tab.id] = React.createRef();
  });

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const config = await window.electronAPI.getConfig();
        const loadedFavorites = config?.favorites;
        if (loadedFavorites && typeof loadedFavorites === 'object' && !Array.isArray(loadedFavorites)) {
          setFavorites(loadedFavorites);
        } else {
          setFavorites({ ' ': [] });
        }
      } catch (err) {
        console.error('Failed to load favorites:', err);
        setFavorites({ ' ': [] });
      }
    };
    loadFavorites();
  }, []);

  // Handle screen size changes
  useEffect(() => {
    const handleScreenSizeChange = (_event: any, size: { width: number; height: number }) => {
      const baseWidth = 1920;
      const scaleFactorUI = Math.min(Math.max(size.width / baseWidth, 0.8), 1.2);
      const scaleFactorDPI = require('electron').screen.getPrimaryDisplay().scaleFactor;
      setScale(size.width <= 1366 ? 1.0 : scaleFactorUI * scaleFactorDPI);
    };

    window.electronAPI.ipc.on('screen-size-changed', handleScreenSizeChange);
    return () => {
      window.electronAPI.ipc.off('screen-size-changed', handleScreenSizeChange);
    };
  }, []);

  const handleNewTab = (url: string = 'https://www.google.com') => {
    const newId = Date.now();
    const newTab = { id: newId, title: url.startsWith('http') ? url : 'New Tab', url, isNew: true };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const markTabAsNotNew = (id: number) => {
    setTabs(prev => prev.map(tab => tab.id === id ? { ...tab, isNew: false } : tab));
  };

  const handleCloseTab = (id: number) => {
    const closedTab = tabs.find(t => t.id === id);
    if (closedTab) {
      setClosedTabs(prev => [closedTab, ...prev.slice(0, 9)]);
    }
    const updated = tabs.filter(t => t.id !== id);
    setTabs(updated);
    if (activeTabId === id && updated.length > 0) setActiveTabId(updated[0].id);
  };

  const handleReopenTab = () => {
    if (closedTabs.length === 0) return;
    const [reopenedTab, ...remaining] = closedTabs;
    setTabs([...tabs, reopenedTab]);
    setActiveTabId(reopenedTab.id);
    setClosedTabs(remaining);
  };

  const handleSaveFavorite = async () => {
    const webview = webviews[activeTabId]?.current;
    if (webview) {
      const url = webview.getURL();
      const title = await webview.executeJavaScript('document.title') || url;
      const newFavorite: Favorite = { name: title, url, favicon: '⭐' };
      const newFavorites: { [key: string]: Favorite[] } = {
        ...favorites,
        ' ': [...(favorites[' '] || []), newFavorite],
      };
      if (window.electronAPI.saveFavorites) {
        await window.electronAPI.saveFavorites(newFavorites);
        setFavorites(newFavorites);
      } else {
        console.error('electronAPI.saveFavorites is not available');
      }
    }
  };

  const navigate = (url: string) => {
    setTabs(tabs.map(tab => tab.id === activeTabId ? { ...tab, url } : tab));
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget;
      let url = input.value;
      if (!url.startsWith('http')) url = 'https://' + url;
      navigate(url);
    }
  };

  function openFavorite(url: string, newTab?: boolean): void {
    if (newTab) {
      handleNewTab(url);
    } else {
      setTabs(prev =>
        prev.map(tab =>
          tab.id === activeTabId ? { ...tab, url } : tab
        )
      );
    }
  }

  // Zoom handlers for Navbar
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
    webviews[activeTabId]?.current?.setZoomLevel(zoomLevel + 0.1);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
    webviews[activeTabId]?.current?.setZoomLevel(zoomLevel - 0.1);
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    webviews[activeTabId]?.current?.setZoomLevel(1);
  };

  const handleNewWindow = () => {
    window.electronAPI.ipc.on('open-new-window', () => {
      const event = new CustomEvent('open-new-window');
      window.dispatchEvent(event);
    });
  };

  const handleNewPrivateWindow = () => {
    window.electronAPI.ipc.on('open-private-window', () => {
      const event = new CustomEvent('open-private-window');
      window.dispatchEvent(event);
    });
  };

  // Handle events
  useEffect(() => {
    const handleOpenTab = (e: CustomEvent) => {
      handleNewTab(e.detail.url);
    };
    const handleNewTabShortcut = () => handleNewTab();
    const handleCloseTabShortcut = () => {
      if (tabs.length > 0) handleCloseTab(activeTabId);
    };
    const handleReopenTabShortcut = handleReopenTab;
    const handleSaveFavoriteShortcut = handleSaveFavorite;

    window.addEventListener('open-tab', handleOpenTab as any);
    window.addEventListener('shortcut-new-tab', handleNewTabShortcut);
    window.addEventListener('shortcut-close-tab', handleCloseTabShortcut);
    window.addEventListener('shortcut-reopen-tab', handleReopenTabShortcut);
    window.addEventListener('shortcut-save-favorite', handleSaveFavoriteShortcut);

    return () => {
      window.removeEventListener('open-tab', handleOpenTab as any);
      window.removeEventListener('shortcut-new-tab', handleNewTabShortcut);
      window.removeEventListener('shortcut-close-tab', handleCloseTabShortcut);
      window.removeEventListener('shortcut-reopen-tab', handleReopenTabShortcut);
      window.removeEventListener('shortcut-save-favorite', handleSaveFavoriteShortcut);
    };
  }, [tabs, activeTabId, closedTabs, handleSaveFavorite]);

  // Fetch <title> and favicon
  useEffect(() => {
    const webview = webviews[activeTabId]?.current;
    if (webview) {
      const handleLoad = () => {
        webview.executeJavaScript(`
          (() => {
            const icon = document.querySelector("link[rel*='icon']");
            const title = document.title || '';
            return { favicon: icon?.href || '', title };
          })();
        `).then((result: { favicon: string; title: string }) => {
          setTabs(prev =>
            prev.map(tab =>
              tab.id === activeTabId
                ? {
                    ...tab,
                    favicon: result.favicon || tab.favicon,
                    title: result.title || tab.title,
                  }
                : tab
            )
          );
        });
      };
      webview.addEventListener('did-stop-loading', handleLoad);
      return () => webview.removeEventListener('did-stop-loading', handleLoad);
    }
  }, [activeTabId, tabs]);

  return (
    <div
      className="h-screen w-screen flex bg-neutral-900 text-white font-sans"
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col">
        <div className="flex space-x-2 px-3 py-2 bg-black border-b border-gray-800 overflow-x-auto z-[1000]">
          <Tabs
            tabs={tabs}
            activeTabId={activeTabId}
            setActiveTabId={setActiveTabId}
            handleCloseTab={handleCloseTab}
            markTabAsNotNew={markTabAsNotNew}
          />
          <button
            onClick={() => handleNewTab()}
            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-md text-sm font-medium transition-all"
            title="New Tab"
          >
            ➕
          </button>
        </div>
        <div className="flex flex-col w-full z-[1000]">
          <Navbar
            url={activeTab?.url || ''}
            webviewRef={webviews[activeTabId]}
            onNavigate={navigate}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            zoomLevel={zoomLevel}
            onNewTab={handleNewTab}
            onNewWindow={handleNewWindow}
            onNewPrivateWindow={handleNewPrivateWindow}
            zoom={scale}
          />
          <FavoritesBar onFavoriteClick={openFavorite} />
        </div>
        <div className="flex-1 relative z-0">
          {tabs.map(tab =>
            tab.id === activeTabId ? (
              <webview
                key={tab.id}
                ref={webviews[tab.id]}
                src={tab.url}
                style={{ width: '100%', height: '100%', zIndex: -1 }}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}