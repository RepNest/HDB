import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Tab, ElectronWebview, WebViewPageTitleUpdatedEvent, WebViewDidNavigateEvent, WebViewDidFailLoadEvent } from '../types';

interface WebviewContainerProps {
  tab: Tab;
  active: boolean;
  zoomLevel: number;
  onWebviewRef: (id: number) => (ref: ElectronWebview | null) => void;
  setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
}

const WebviewContainer: React.FC<WebviewContainerProps> = ({ tab, active, zoomLevel, onWebviewRef, setTabs }) => {
  const webviewRef = useRef<ElectronWebview | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      console.log(`Webview container for tab ${tab.id} dimensions:`, {
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, [tab.id, active]);

  useEffect(() => {
    if (webviewRef.current) {
      console.log(`Webview ${tab.id} initialized`, { src: webviewRef.current.src, readyState: webviewRef.current.readyState });
      webviewRef.current.addEventListener('did-start-loading', () => {
        console.log(`Webview ${tab.id} started loading: ${webviewRef.current?.src}`);
        setTabs(prev =>
          prev.map(t => (t.id === tab.id ? { ...t, title: 'Loading...' } : t))
        );
      });
      webviewRef.current.addEventListener('page-title-updated', (e: WebViewPageTitleUpdatedEvent) => {
        console.log(`Webview ${tab.id} title updated to: ${e.title}`);
        setTabs(prev =>
          prev.map(t => (t.id === tab.id ? { ...t, title: e.title } : t))
        );
      });
      webviewRef.current.addEventListener('did-navigate', (e: WebViewDidNavigateEvent) => {
        console.log(`Webview ${tab.id} navigated to: ${e.url}`);
        if (!tab.isNew) {
          setTabs(prev =>
            prev.map(t => (t.id === tab.id ? { ...t, url: e.url } : t))
          );
        }
        if (tab.url === 'https://informs.miamidade.gov/psc/EIH91PRD/EMPLOYEE/EMPL/c/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?&') {
          window.electronAPI.ipc.send('webview-ready', tab.id, e.url);
        }
      });
      webviewRef.current.addEventListener('did-fail-load', (e: WebViewDidFailLoadEvent) => {
        console.error(`Webview ${tab.id} failed to load: ${e.errorDescription} (Code: ${e.errorCode})`, { url: e.validatedURL });
      });
    }
  }, [tab.id, tab.isNew, tab.url, setTabs]);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{ display: active ? 'block' : 'none', backgroundColor: '#000' }} // Debug background
    >
      <webview
        ref={ref => onWebviewRef(tab.id)(ref as ElectronWebview | null)}
        src={tab.url}
        partition="persist:webview"
        preload="file://C:/Users/e328561/Documents/GitHub/HDB/preload.js"
        className={clsx('w-full h-full')}
        style={{ zoom: zoomLevel }}
        allowpopups
      />
    </div>
  );
};

export default WebviewContainer;