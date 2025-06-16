import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Tabs from './components/Tabs';
import FavoritesBar from './components/FavoritesBar';
import WebviewComponent from './components/WebviewComponent';
import clsx from 'clsx';
import { Config, Tab, ElectronWebview } from './types';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([{ id: Date.now(), title: 'New Tab', url: 'https://www.google.com' }]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [config, setConfig] = useState<Config>({
    sidebarCollapsed: false,
    apps: [],
    favorites: {},
    itdTools: {
      appsOrder: [],
      visibleApps: [],
      buttonOrder: [],
      visibleITDButtons: [],
      isEditMode: false,
      navBackgroundColor: 'purple',
      isDarkMode: true,
      buttonSize: 'medium',
    },
    history: [],
    createdAt: new Date().toISOString(),
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const webviews = useRef<{ [key: number]: ElectronWebview | null }>({});
  const baseWidth = 1920;

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig: Config = await window.electronAPI.getConfig();
        setConfig(loadedConfig);
        document.documentElement.classList.toggle('dark', loadedConfig.itdTools.isDarkMode ?? true);
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    };
    loadConfig();
  }, []);

  const handleNewTab = (url: string) => {
    const newId = Date.now();
    setTabs(prev => [...prev, { id: newId, title: 'New Tab', url, isNew: true }]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: number) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== id);
      if (newTabs.length === 0) {
        const newId = Date.now();
        return [{ id: newId, title: 'New Tab', url: 'https://www.google.com' }];
      }
      return newTabs;
    });
    if (activeTabId === id) {
      const newActiveTab = tabs.find(tab => tab.id !== id);
      if (newActiveTab) setActiveTabId(newActiveTab.id);
    }
  };

  const handleTabClick = (id: number) => {
    setActiveTabId(id);
  };

  const handleNavigate = (url: string) => {
    setTabs(prev =>
      prev.map(tab =>
        tab.id === activeTabId ? { ...tab, url, title: 'Loading...', isNew: false } : tab
      )
    );
  };

  const handleQueryViewer = async () => {
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
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    window.electronAPI.ipc.once(`landing-page-ready-${newId}`, () => {
      setTabs(prev =>
        prev.map(tab =>
          tab.id === newId ? { ...tab, url: targetUrl, title: 'Query Viewer' } : tab
        )
      );
    });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ width: '100%' }}>
      <Tabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onCloseTab={handleCloseTab}
        onNewTab={() => handleNewTab('https://www.google.com')}
        navColor={config.itdTools.navBackgroundColor || 'purple'}
        isDarkMode={config.itdTools.isDarkMode ?? true}
      />
      <div className="flex flex-col w-full mt-[0.5px]" style={{ flexGrow: 0 }}>
        <Navbar
          url={tabs.find(tab => tab.id === activeTabId)?.url || ''}
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
          navColor={config.itdTools.navBackgroundColor || 'purple'}
          config={config}
          setConfig={setConfig}
        />
        <FavoritesBar
          className="translate-y-[0.25px]"
          favorites={{
            ' ': [{ name: 'Google', url: 'https://www.google.com', favicon: 'https://www.google.com/favicon.ico' }],
            'Frequent Sites': [
              { name: 'ITD Intra', url: 'https://miamidadecounty.sharepoint.com/sites/ITD-Intra', favicon: 'https://miamidadecounty.sharepoint.com/favicon.ico' },
              { name: 'Outlook', url: 'https://outlook.office.com', favicon: 'https://outlook.office.com/favicon.ico' },
              { name: 'Citrix Secure Sign In', url: 'https://xenapp.cloud.com', favicon: 'https://xenapp.cloud.com/favicon.ico' },
              { name: 'Sign In - Webex', url: 'https://desktop.wxcc-us1.cisco.com/iframe-widget', favicon: 'https://desktop.wxcc-us1.cisco.com/favicon.ico' },
              { name: 'IT Service Desk - Home', url: 'https://miamidadecounty.sharepoint.com/sites/ITServiceDesk', favicon: 'https://miamidadecounty.sharepoint.com/favicon.ico' },
            ],
          }}
          onNavigate={handleNavigate}
          navColor={config.itdTools.navBackgroundColor || 'purple'}
          isDarkMode={config.itdTools.isDarkMode ?? true}
        />
      </div>
      <div className="flex flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <Sidebar
          isOpen={sidebarOpen}
          toggle={() => setSidebarOpen(!sidebarOpen)}
          navColor={config.itdTools.navBackgroundColor || 'purple'}
          handleNewTab={handleNewTab}
          handleQueryViewer={handleQueryViewer}
        />
        <WebviewComponent
          tabs={tabs}
          activeTabId={activeTabId}
          zoomLevel={zoomLevel}
          setTabs={setTabs}
        />
      </div>
    </div>
  );
};

export default App;