import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FavoritesBar from './components/FavoritesBar';
import clsx from 'clsx';

type Tab = { id: number; title: string; url: string; favicon?: string };
type Favorite = { name: string; url: string; favicon?: string };

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, title: 'ITD Intra', url: 'https://miamidadecounty.sharepoint.com/sites/ITD-Intra' },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [closedTabs, setClosedTabs] = useState<Tab[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const addressInput = useRef<HTMLInputElement>(null);
  const webviews: Record<number, React.RefObject<any>> = {};

  tabs.forEach(tab => {
    if (!webviews[tab.id]) webviews[tab.id] = React.createRef();
  });

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      const config = await window.electronAPI?.getConfig?.();
      const loadedFavorites = config?.favorites;
      if (loadedFavorites && typeof loadedFavorites === 'object') {
        setFavorites(Object.values(loadedFavorites).flat());
      } else {
        setFavorites([]);
      }
    };
    loadFavorites();
  }, []);

  const handleNewTab = (url: string = 'https://www.google.com') => {
    const newId = Date.now();
    const newTab = { id: newId, title: url.startsWith('http') ? url : 'New Tab', url };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
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
      const newFavorites = {
        ...favorites,
        ' ': [...(favorites[' '] || []), newFavorite],
      };
      if (window.electronAPI?.saveFavorites) {
        await window.electronAPI.saveFavorites(newFavorites);
        setFavorites(Object.values(newFavorites).flat());
      }
    }
  };

  const navigate = () => {
    if (!addressInput.current) return;
    let url = addressInput.current.value;
    if (!url.startsWith('http')) url = 'https://' + url;
    setTabs(tabs.map(tab => tab.id === activeTabId ? { ...tab, url } : tab));
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigate();
  };

  function openFavorite(url: string): void {
    setTabs(prev =>
      prev.map(tab =>
        tab.id === activeTabId ? { ...tab, url } : tab
      )
    );
  }

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

    window.addEventListener('open-tab', handleOpenTab as EventListener);
    window.addEventListener('shortcut:new-tab', handleNewTabShortcut);
    window.addEventListener('shortcut:close-tab', handleCloseTabShortcut);
    window.addEventListener('shortcut:reopen-tab', handleReopenTabShortcut);
    window.addEventListener('shortcut:save-favorite', handleSaveFavoriteShortcut);

    return () => {
      window.removeEventListener('open-tab', handleOpenTab as EventListener);
      window.removeEventListener('shortcut:new-tab', handleNewTabShortcut);
      window.removeEventListener('shortcut:close-tab', handleCloseTabShortcut);
      window.removeEventListener('shortcut:reopen-tab', handleReopenTabShortcut);
      window.removeEventListener('shortcut:save-favorite', handleSaveFavoriteShortcut);
    };
  }, [tabs, activeTabId, closedTabs, favorites]);

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
    <div className="h-screen w-screen flex bg-neutral-900 text-white font-sans">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col">
        {/* Address Bar */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-800 to-indigo-900 p-2 shadow-md">
          <button onClick={() => webviews[activeTabId]?.current?.loadURL('https://miamidadecounty.sharepoint.com/sites/ITServiceDesk')} className="px-2">🏠</button>
          <button onClick={() => webviews[activeTabId]?.current?.goBack()} className="px-2">⟨</button>
          <button onClick={() => webviews[activeTabId]?.current?.goForward()} className="px-2">⟩</button>
          <button onClick={() => webviews[activeTabId]?.current?.reload()} className="px-2">⟳</button>
          <input
            ref={addressInput}
            defaultValue={activeTab?.url}
            onKeyDown={handleEnter}
            className="flex-1 px-3 py-1 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button onClick={() => handleNewTab()} className="px-2 py-1 bg-pink-600 rounded hover:bg-pink-500">➕</button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 px-3 py-2 bg-black border-b border-gray-800 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={clsx(
                'px-4 py-1 rounded-full text-sm cursor-pointer font-medium transition-all flex items-center gap-2',
                tab.id === activeTabId ? 'bg-pink-600' : 'bg-gray-700 hover:bg-purple-600'
              )}
            >
              {tab.favicon && <img src={tab.favicon} alt="favicon" className="w-4 h-4" />}
              <span title={tab.title}>
                {tab.title.length > 25 ? tab.title.slice(0, 25) + '…' : tab.title}
              </span>
              <span
                className="ml-2 text-red-300 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id);
                }}
              >
                ×
              </span>
            </div>
          ))}
        </div>

        <FavoritesBar onFavoriteClick={openFavorite} />

        {/* Webview Display */}
        <div className="flex-1 relative">
          {tabs.map(tab =>
            tab.id === activeTabId ? (
              <webview
                key={tab.id}
                ref={webviews[tab.id]}
                src={tab.url}
                style={{ width: '100%', height: '100%' }}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}