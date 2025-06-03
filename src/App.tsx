// App.tsx
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FavoritesBar from './components/FavoritesBar';
import Tabs from './components/Tabs';

type Tab = {
  id: number;
  title: string;
  url: string;
  favicon?: string;
};

type Favorite = {
  name: string;
  url: string;
  favicon?: string;
};

type FolderedFavorites = {
  [folder: string]: Favorite[];
};

type HistoryEntry = {
  url: string;
  timestamp: number;
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, title: 'ITD Intra', url: 'https://miamidadecounty.sharepoint.com/sites/ITD-Intra' }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [favorites, setFavorites] = useState<FolderedFavorites>({});
  const [closedTabs, setClosedTabs] = useState<Tab[]>([]);
  const [showFolderPrompt, setShowFolderPrompt] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [browserHistory, setBrowserHistory] = useState<HistoryEntry[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);

  const addressInput = useRef<HTMLInputElement>(null);
  const webviews: Record<number, React.RefObject<any>> = {};
  tabs.forEach(tab => {
    if (!webviews[tab.id]) webviews[tab.id] = React.createRef();
  });

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    if (addressInput.current && activeTab?.url) {
      addressInput.current.value = activeTab.url;
    }
  }, [activeTabId]);

  useEffect(() => {
    window.electronAPI.getConfig?.().then(config => {
      setFavorites(config?.favorites || {});
      setBrowserHistory(config?.history || []);
    });
  }, []);

  const handleNewTab = () => {
    const newId = Date.now();
    const newTab = { id: newId, title: 'New Tab', url: 'https://www.google.com' };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: number) => {
    const closedTab = tabs.find(t => t.id === id);
    if (closedTab) setClosedTabs(prev => [...prev, closedTab]);
    const updated = tabs.filter(t => t.id !== id);
    setTabs(updated);
    if (activeTabId === id && updated.length > 0) {
      setActiveTabId(updated[updated.length - 1].id);
    }
  };

  const handleReopenTab = () => {
    if (closedTabs.length > 0) {
      const last = closedTabs[closedTabs.length - 1];
      setTabs(prev => [...prev, last]);
      setActiveTabId(last.id);
      setClosedTabs(prev => prev.slice(0, -1));
    }
  };

  const navigate = () => {
    if (!addressInput.current) return;
    let url = addressInput.current.value.trim();
    const isLikelyUrl = url.includes('.') && !url.includes(' ');
    if (!url.startsWith('http') && isLikelyUrl) url = 'https://' + url;
    if (!isLikelyUrl) url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    setTabs(tabs.map(tab => (tab.id === activeTabId ? { ...tab, url } : tab)));
    saveHistory(url);
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigate();
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value.toLowerCase();

  if (value.trim() === '') {
    const recent = browserHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
    setFilteredHistory(recent);
    setShowHistoryDropdown(true);
    return;
  }

  const filtered = browserHistory
    .filter(entry => entry.url.toLowerCase().includes(value))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  setFilteredHistory(filtered);
  setShowHistoryDropdown(true);
};



  const openFavorite = (url: string) => {
    const newId = Date.now();
    const newTab = { id: newId, title: 'New Tab', url };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const promptFavoriteSave = () => setShowFolderPrompt(true);

  const saveFavoriteToFolder = async () => {
    if (!activeTab?.url || !activeTab?.title) return;
    const folder = selectedFolder || newFolderName.trim() || ' ';
    const newFavorite = {
      name: activeTab.title,
      url: activeTab.url,
      favicon: getFaviconFromURL(activeTab.url)
    };
    const current = { ...favorites };
    const exists = current[folder]?.some(f => f.url === newFavorite.url);
    if (exists) return;
    current[folder] = [...(current[folder] || []), newFavorite];
    setFavorites(current);
    await window.electronAPI.saveFavorites?.(current);
    setShowFolderPrompt(false);
    setNewFolderName('');
    setSelectedFolder(null);
  };

    const saveHistory = async (url: string) => {
    if (!url) return;
    const exists = browserHistory.some(entry => entry.url === url);
    if (exists) return;
    const updated = [...browserHistory, { url, timestamp: Date.now() }];
    setBrowserHistory(updated);
    await window.electronAPI.saveHistory?.(updated); // Make sure this is exposed in preload.js
  };

  const getFaviconFromURL = (url: string) => {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}/favicon.ico`;
    } catch {
      return '';
    }
  };

  const deleteFavorite = async (name: string, folder?: string) => {
    const updated = { ...favorites };
    const targetFolder = folder || ' ';
    if (updated[targetFolder]) {
      updated[targetFolder] = updated[targetFolder].filter(f => f.name !== name);
      if (updated[targetFolder].length === 0 && targetFolder !== ' ') delete updated[targetFolder];
    }
    setFavorites(updated);
    await window.electronAPI.saveFavorites?.(updated);
  };

  const deleteFolder = async (folderName: string) => {
    const updated = { ...favorites };
    delete updated[folderName];
    setFavorites(updated);
    await window.electronAPI.saveFavorites?.(updated);
  };

  const renameFolder = async (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName === newName || favorites[newName]) return;
    const updated = { ...favorites };
    updated[newName] = updated[oldName];
    delete updated[oldName];
    setFavorites(updated);
    await window.electronAPI.saveFavorites?.(updated);
  };

  useEffect(() => {
    const view = webviews[activeTabId]?.current;
    if (!view) return;

    const updateTabMetadata = () => {
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
    };

    view.addEventListener('page-title-updated', updateTabMetadata);
    view.addEventListener('did-navigate', updateTabMetadata);
    view.addEventListener('did-navigate-in-page', updateTabMetadata);

    return () => {
      view.removeEventListener('page-title-updated', updateTabMetadata);
      view.removeEventListener('did-navigate', updateTabMetadata);
      view.removeEventListener('did-navigate-in-page', updateTabMetadata);
    };
  }, [activeTabId]);

  useEffect(() => {
    const handleHotkeyNewTab = () => handleNewTab();
    const handleHotkeyCloseTab = () => handleCloseTab(activeTabId);
    const handleHotkeyReopenTab = () => handleReopenTab();
    const handleHotkeySaveFavorite = () => promptFavoriteSave();

    window.addEventListener('shortcut:new-tab', handleHotkeyNewTab);
    window.addEventListener('shortcut:close-tab', handleHotkeyCloseTab);
    window.addEventListener('shortcut:reopen-tab', handleHotkeyReopenTab);
    window.addEventListener('shortcut:save-favorite', handleHotkeySaveFavorite);

    return () => {
      window.removeEventListener('shortcut:new-tab', handleHotkeyNewTab);
      window.removeEventListener('shortcut:close-tab', handleHotkeyCloseTab);
      window.removeEventListener('shortcut:reopen-tab', handleHotkeyReopenTab);
      window.removeEventListener('shortcut:save-favorite', handleHotkeySaveFavorite);
    };
  }, [tabs, activeTabId, closedTabs]);

    useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key presses inside inputs/textareas
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Ctrl + R or F5: Reload tab
      if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        webviews[activeTabId]?.current?.reload();
      }

      // Ctrl + Tab: Next tab
      if (e.ctrlKey && !e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTabId(tabs[nextIndex].id);
      }

      // Ctrl + Shift + Tab: Previous tab
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        setActiveTabId(tabs[prevIndex].id);
      }

      // Ctrl + 1–9: Jump to tab
      if (e.ctrlKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const tabIndex = parseInt(e.key, 10) - 1;
        if (tabIndex < tabs.length) {
          setActiveTabId(tabs[tabIndex].id);
        }
      }

      // Escape: Dismiss folder prompt or context menus
      if (e.key === 'Escape') {
        setShowFolderPrompt(false);
        setShowHistoryDropdown(false);

        // Restore current tab URL if address bar is empty
        if (document.activeElement === addressInput.current && addressInput.current?.value === '') {
          if (activeTab?.url) {
            addressInput.current.value = activeTab.url;
          }
        }

        const openMenus = document.querySelectorAll('.context-menu');
        openMenus.forEach(menu => menu.remove());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, webviews]);


  const goHome = () => {
    const homepage = 'https://miamidadecounty.sharepoint.com/sites/ITServiceDesk';
    setTabs(tabs.map(tab => (tab.id === activeTabId ? { ...tab, url: homepage } : tab)));
  };

  return (
    <div className="h-screen w-screen flex bg-neutral-900 text-white font-sans">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-800 to-indigo-900 p-2 shadow-md">
          <button onClick={goHome} className="px-2" title="Home">🏠</button>
          <button onClick={() => webviews[activeTabId]?.current?.goBack()} className="px-2">⟨</button>
          <button onClick={() => webviews[activeTabId]?.current?.goForward()} className="px-2">⟩</button>
          <button onClick={() => webviews[activeTabId]?.current?.reload()} className="px-2">⟳</button>
          <input
            ref={addressInput}
            defaultValue={activeTab?.url}
            onKeyDown={handleEnter}
            onChange={handleAddressChange}
            onFocus={() => {
              const recent = browserHistory
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 8);
              setFilteredHistory(recent);
              setShowHistoryDropdown(true);
            }}
            onBlur={() => setTimeout(() => setShowHistoryDropdown(false), 200)}
            className="flex-1 px-3 py-1 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {showHistoryDropdown && (
            <div className="absolute top-14 left-48 right-4 z-50 bg-white text-black shadow-md rounded max-h-64 overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="p-2 text-sm text-gray-600">No recent history</div>
              ) : (
                filteredHistory.map((entry, i) => (
                  <div
                    key={i}
                    onMouseDown={() => {
                      if (addressInput.current) {
                        addressInput.current.value = entry.url;
                        navigate();
                        setShowHistoryDropdown(false);
                      }
                    }}
                    className="px-3 py-2 hover:bg-gray-200 cursor-pointer text-sm truncate"
                  >
                    {entry.url}
                  </div>
                ))
              )}
            </div>
          )}

          <button onClick={promptFavoriteSave} className="px-2 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-400" title="Add to Favorites">⭐</button>
          <button onClick={handleNewTab} className="px-2 py-1 bg-pink-600 rounded hover:bg-pink-500">➕</button>
        </div>

        <Tabs tabs={tabs} activeTabId={activeTabId} setActiveTabId={setActiveTabId} handleCloseTab={handleCloseTab} />

        <FavoritesBar
          favorites={favorites}
          onFavoriteClick={openFavorite}
          onFavoriteDelete={deleteFavorite}
          onFolderRename={renameFolder}
          onFolderDelete={deleteFolder}
        />

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

      {showFolderPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded p-4 w-96">
            <h2 className="text-lg font-bold mb-2">Add Favorite to Folder</h2>
            <label className="block mb-1">Select Existing Folder:</label>
            <select
              className="w-full mb-2 p-2 border"
              onChange={(e) => setSelectedFolder(e.target.value)}
              value={selectedFolder || ''}
            >
              <option value="">-- Choose a folder --</option>
              {Object.keys(favorites).filter(f => f !== ' ').map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>

            <label className="block mb-1 mt-2">Or Create New Folder:</label>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="w-full p-2 border"
            />

            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setShowFolderPrompt(false)} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
              <button onClick={saveFavoriteToFolder} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}