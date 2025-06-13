import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';

// Define Electron-specific webview type
interface ElectronWebview extends HTMLWebViewElement {
  loadURL: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
}

// Define custom event type for did-fail-load
interface WebViewDidFailLoadEvent extends Event {
  errorDescription: string;
  errorCode: number;
  validatedURL: string;
}

interface WebviewComponentProps {
  tabs: { id: number; title: string; url: string; isNew?: boolean }[];
  activeTabId: number;
  zoomLevel: number;
  setTabs: React.Dispatch<React.SetStateAction<{ id: number; title: string; url: string; isNew?: boolean }[]>>;
}

const WebviewComponent: React.FC<WebviewComponentProps> = ({ tabs, activeTabId, zoomLevel, setTabs }) => {
  const webviews = useRef<{ [key: number]: ElectronWebview | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      console.log('Webview container dimensions:', containerRef.current.getBoundingClientRect());
    }
  }, [activeTabId]); // Re-run on tab switch to check dimensions

  const handleWebviewRef = (id: number) => (ref: ElectronWebview | null) => {
    webviews.current[id] = ref;
    if (ref) {
      console.log(`Webview ${id} initialized`, ref); // Debug log
      ref.addEventListener('did-start-loading', () => {
        setTabs(prev =>
          prev.map(tab =>
            tab.id === id ? { ...tab, title: 'Loading...' } : tab
          )
        );
      });
      ref.addEventListener('page-title-updated', (e: any) => {
        setTabs(prev =>
          prev.map(tab =>
            tab.id === id ? { ...tab, title: e.title } : tab
          )
        );
      });
      ref.addEventListener('did-navigate', (e: any) => {
        if (!tabs.find(tab => tab.id === id)?.isNew) {
          setTabs(prev =>
            prev.map(tab =>
              tab.id === id ? { ...tab, url: e.url } : tab
            )
          );
        }
        if (tabs.find(tab => tab.id === id)?.url === 'https://informs.miamidade.gov/psc/EIH91PRD/EMPLOYEE/EMPL/c/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?&') {
          window.electronAPI.ipc.send('landing-page-ready', id);
        }
      });
      // Cast ref to any for did-fail-load event (Electron-specific)
      (ref as any).addEventListener('did-fail-load', (e: WebViewDidFailLoadEvent) => {
        console.error(`Webview ${id} failed to load:`, e.errorDescription);
      });
    }
  };

  return (
    <div className="flex-1 relative" ref={containerRef}>
      {tabs.map(tab => (
        <webview
          key={tab.id}
          ref={handleWebviewRef(tab.id)}
          src={tab.url}
          partition="persist:webview"
          preload="./preload.js"
          className={clsx(
            'absolute top-0 left-0 w-full h-full',
            activeTabId === tab.id ? 'block' : 'hidden'
          )}
          style={{ zoom: zoomLevel }}
          allowpopups={true}
        />
      ))}
    </div>
  );
};

export default WebviewComponent;