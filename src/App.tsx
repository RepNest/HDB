import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FavoritesBar from './components/FavoritesBar';
import clsx from 'clsx';

type Tab = { id: number; title: string; url: string; favicon?: string };

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, title: 'ITD Intra', url: 'https://miamidadecounty.sharepoint.com/sites/ITD-Intra' },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const addressInput = useRef<HTMLInputElement>(null);
  const webviews: Record<number, React.RefObject<any>> = {};

  tabs.forEach(tab => {
    if (!webviews[tab.id]) webviews[tab.id] = React.createRef();
  });

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleNewTab = () => {
    const newId = Date.now();
    const newTab = { id: newId, title: 'New Tab', url: 'https://www.google.com' };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: number) => {
    const updated = tabs.filter(t => t.id !== id);
    setTabs(updated);
    if (activeTabId === id && updated.length > 0) setActiveTabId(updated[0].id);
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

  // Favicon fetcher
  useEffect(() => {
    const webview = webviews[activeTabId]?.current;
    if (webview) {
      const handleLoad = () => {
        webview.executeJavaScript(`
          (() => {
            const icon = document.querySelector("link[rel*='icon']");
            return icon?.href || '';
          })();
        `).then((faviconUrl: string) => {
          if (faviconUrl) {
            setTabs(prev =>
              prev.map(tab =>
                tab.id === activeTabId ? { ...tab, favicon: faviconUrl } : tab
              )
            );
          }
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
          <button onClick={handleNewTab} className="px-2 py-1 bg-pink-600 rounded hover:bg-pink-500">➕</button>
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
              {tab.title}
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
