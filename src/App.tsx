import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Tabs from './components/Tabs';
import FavoritesBar from './components/FavoritesBar';
import WebviewComponent from './components/WebviewComponent';
import CustomizeSpartanPanel from './components/CustomizeSpartanPanel';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import { ConfigProvider } from './components/ConfigContext';
import clsx from 'clsx';
import { Tab, ElectronWebview } from './types';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([{ id: Date.now(), title: 'New Tab', url: 'https://www.google.com' }]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [closedTabs, setClosedTabs] = useState<Tab[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const webviews = useRef<{ [key: number]: ElectronWebview | null }>({});
  const baseWidth = 1920;

  const pinnedTabs = useMemo(() => tabs.filter((tab) => tab.pinned), [tabs]);

  const handleNewTab = useCallback((url: string) => {
    const newId = Date.now();
    const title = url === 'spartan://history' ? 'History' : url === 'spartan://settings' ? 'Settings' : 'New Tab';
    setTabs((prev) => [...prev, { id: newId, title, url, isNew: true }]);
    setActiveTabId(newId);
  }, []);

  const handleCloseTab = useCallback((id: number) => {
    setTabs((prev) => {
      const closedTab = prev.find((tab) => tab.id === id);
      if (closedTab) {
        setClosedTabs((prevClosed) => [closedTab, ...prevClosed].slice(0, 10));
      }
      const newTabs = prev.filter((tab) => tab.id !== id);
      if (newTabs.length === 0) {
        const newId = Date.now();
        return [{ id: newId, title: 'New Tab', url: 'https://www.google.com' }];
      }
      return newTabs;
    });
    if (activeTabId === id) {
      setActiveTabId((prev) => {
        const newActiveTab = tabs.find((tab) => tab.id !== id);
        return newActiveTab ? newActiveTab.id : prev;
      });
    }
  }, [activeTabId, tabs]);

  const handleCloseOtherTabs = useCallback((keepId: number) => {
    setTabs((prev) => {
      const keptTab = prev.find((tab) => tab.id === keepId);
      const closed = prev.filter((tab) => tab.id !== keepId);
      setClosedTabs((prevClosed) => [...closed, ...prevClosed].slice(0, 10));
      return keptTab ? [keptTab] : [{ id: Date.now(), title: 'New Tab', url: 'https://www.google.com' }];
    });
    setActiveTabId(keepId);
  }, []);

  const handleReopenClosedTab = useCallback(() => {
    setClosedTabs((prev) => {
      if (prev.length === 0) return prev;
      const [lastClosed, ...rest] = prev;
      const newId = Date.now();
      setTabs((prevTabs) => [...prevTabs, { ...lastClosed, id: newId }]);
      setActiveTabId(newId);
      return rest;
    });
  }, []);

  const handleTabClick = useCallback((id: number) => {
    setActiveTabId(id);
  }, []);

  const handleNavigate = useCallback((url: string) => {
    const newId = Date.now();
    const title = url === 'spartan://history' ? 'History' : url === 'spartan://settings' ? 'Settings' : 'Loading...';
    setTabs((prev) => [...prev, { id: newId, title, url, isNew: false }]);
    setActiveTabId(newId);
  }, []);

  const handleReorderTabs = useCallback((sourceIndex: number, destinationIndex: number) => {
    setTabs((prev) => {
      const newTabs = [...prev];
      const [reorderedTab] = newTabs.splice(sourceIndex, 1);
      newTabs.splice(destinationIndex, 0, reorderedTab);
      return newTabs;
    });
  }, []);

  const handlePinTab = useCallback((id: number) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === id ? { ...tab, pinned: !tab.pinned } : tab
      )
    );
  }, []);

  const handleReplaceTab = useCallback((id: number, url: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === id
          ? { ...tab, url, title: url === 'spartan://history' ? 'History' : url === 'spartan://settings' ? 'Settings' : 'Loading...', isNew: false }
          : tab
      )
    );
  }, []);

  const handleQueryViewer = useCallback(async () => {
    const landingUrl = 'https://informs.miamidade.gov/psc/EIH91PRD/EMPLOYEE/EMPL/c/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?&';
    const targetUrl = 'https://ehrprd.miamidade.gov/psc/EHR92PRD_2/EMPLOYEE/HRMS/q/?ICAction=ICQryNameURL=PUBLIC.MD_HELPDESK_ID_SEARCH';
    try {
      await window.electronAPI.ipc.invoke('clear-cookies', 'https://informs.miamidade.gov');
      console.log('Cookies cleared for informs.miamidade.gov');
    } catch (err) {
      console.error('Failed to clear cookies:', err);
    }
    const newId = Date.now();
    const newTab = { id: newId, title: 'INFORMS', url: landingUrl, isNew: true };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    window.electronAPI.ipc.once(`landing-page-ready-${newId}`, () => {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === newId ? { ...tab, url: targetUrl, title: 'Query Viewer' } : tab
        )
      );
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  return (
    <ConfigProvider>
      <div className="flex flex-col h-screen overflow-hidden" style={{ width: '100%' }}>
        <Tabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={handleTabClick}
          onCloseTab={handleCloseTab}
          onCloseOtherTabs={handleCloseOtherTabs}
          onReopenClosedTab={handleReopenClosedTab}
          onNewTab={() => handleNewTab('https://www.google.com')}
          onReorderTabs={handleReorderTabs}
          onPinTab={handlePinTab}
          onReplaceTab={handleReplaceTab}
          navColor="purple"
          isDarkMode={true}
          tabBorderWidth="medium"
          highContrast={false}
        />
        <div className="flex flex-col w-full mt-[0.5px]" style={{ flexGrow: 0 }}>
          <Navbar
            url={tabs.find((tab) => tab.id === activeTabId)?.url || ''}
            webviewRef={webviews.current[activeTabId] || null}
            onNavigate={handleNavigate}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            zoomLevel={zoomLevel}
            onNewTab={handleNewTab}
            onNewWindow={() => window.electronAPI.ipc.send('new-window')}
            onNewPrivateWindow={() => window.electronAPI.ipc.send('new-private-window')}
            zoom={Math.min(window.innerWidth / baseWidth, 1)}
            navColor="purple"
            setCustomizeOpen={setCustomizeOpen}
            pinnedTabs={pinnedTabs}
          />
          <FavoritesBar
            className="translate-y-[1px]"
            onNavigate={handleNavigate}
            navColor="purple"
            isDarkMode={true}
            currentUrl={tabs.find((tab) => tab.id === activeTabId)?.url || ''}
          />
        </div>
        <div className={clsx('flex flex-1 overflow-auto', customizeOpen && 'pr-144')} style={{ minHeight: 0 }}>
          <Sidebar
            isOpen={sidebarOpen}
            toggle={() => setSidebarOpen(!sidebarOpen)}
            navColor="purple"
            handleNewTab={handleNewTab}
            handleQueryViewer={handleQueryViewer}
          />
          {(() => {
            const activeTabUrl = tabs.find((tab) => tab.id === activeTabId)?.url;
            if (activeTabUrl === 'spartan://history') {
              return <HistoryPage onNavigate={handleNavigate} />;
            } else if (activeTabUrl === 'spartan://settings') {
              return <SettingsPage pinnedTabs={pinnedTabs} />;
            } else {
              return (
                <WebviewComponent
                  tabs={tabs}
                  activeTabId={activeTabId}
                  zoomLevel={zoomLevel}
                  setTabs={setTabs}
                />
              );
            }
          })()}
          <CustomizeSpartanPanel
            isOpen={customizeOpen}
            toggle={() => setCustomizeOpen(false)}
            pinnedTabs={pinnedTabs}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default App;