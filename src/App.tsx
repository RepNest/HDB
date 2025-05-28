import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FavoritesBar from './components/FavoritesBar';
import Tabs from './components/Tabs';

type Tab = { 
  id: number; 
  title: string; 
  url: string; 
  favicon?: string 
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, title: 'ITD Intra', url: 'https://miamidadecounty.sharepoint.com/sites/ITD-Intra' }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const addressInput = useRef<HTMLInputElement>(null);
  const webviews: Record<number, React.RefObject<any>> = {};

  tabs.forEach(tab => {
    if (!webviews[tab.id]) webviews[tab.id] = React.createRef();
  });

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Sync address bar to current tab URL
  useEffect(() => {
    if (addressInput.current && activeTab?.url) {
      addressInput.current.value = activeTab.url;
    }
  }, [activeTabId]);

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
    let url = addressInput.current.value.trim();

    const isLikelyUrl = url.includes('.') && !url.includes(' ');
    if (!url.startsWith('http') && isLikelyUrl) url = 'https://' + url;
    if (!isLikelyUrl) url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;

    setTabs(tabs.map(tab => tab.id === activeTabId ? { ...tab, url } : tab));
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") navigate();
  };

  function openFavorite(url: string): void {
    const newId = Date.now();
    const newTab = { id: newId, title: 'New Tab', url };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  }

  // Update tab title + favicon
  useEffect(() => {
    const interval = setInterval(() => {
      const view = webviews[activeTabId]?.current;
      if (!view) return;

      view.executeJavaScript(`
        Promise.resolve({
          title: document.title,
          favicon: (() => {
            const link = document.querySelector("link[rel~='icon']");
            return link ? link.href : null;
          })()
        });
      `, true).then((result: any) => {
        setTabs(prev => prev.map(tab =>
          tab.id === activeTabId
            ? {
              ...tab,
              title: result.title || tab.title,
              favicon: result.favicon || tab.favicon
            }
            : tab
        ));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [activeTabId]);

  // // Inject right-click logic into WebView
  // useEffect(() => {
  //   const view = webviews[activeTabId]?.current;
  //   if (!view) return;

  //   const inject = () => {
  //     view.executeJavaScript(`
  //       window.addEventListener('contextmenu', (e) => {
  //         e.preventDefault();
  //         window.electronAPI?.showContextMenu?.();
  //       });
  //     `).catch(console.error);
  //   };

  //   view.addEventListener('dom-ready', inject);
  //   return () => view.removeEventListener('dom-ready', inject);
  // }, [activeTabId]);

  const goHome = () => {
    const homepage = 'https://miamidadecounty.sharepoint.com/sites/ITServiceDesk';
    setTabs(tabs.map(tab =>
      tab.id === activeTabId ? { ...tab, url: homepage } : tab
    ));
  };

  return (
    <div className="h-screen w-screen flex bg-neutral-900 text-white font-sans">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col">
        {/* Address Bar */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-800 to-indigo-900 p-2 shadow-md">
          <button onClick={goHome} className="px-2" title="Home">🏠</button>
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
        <Tabs
          tabs={tabs}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          handleCloseTab={handleCloseTab}
        />

        <FavoritesBar onFavoriteClick={openFavorite} />

        {/* Webview Display */}
        <div className="flex-1 relative">
          {tabs.map(tab => (
            <webview
              key={tab.id}
              ref={webviews[tab.id]}
              src={tab.url}
              style={{
                width: '100%',
                height: '100%',
                visibility: tab.id === activeTabId ? 'visible' : 'hidden',
                position: tab.id === activeTabId ? 'relative' : 'absolute',
                top: 0,
                left: 0
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
