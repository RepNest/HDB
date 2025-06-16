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

  const getFaviconUrl = async (pageUrl: string): Promise<string> => {
    try {
      const response = await fetch(pageUrl);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const faviconLink = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
      if (faviconLink && faviconLink.getAttribute('href')) {
        const faviconPath = faviconLink.getAttribute('href')!;
        return faviconPath.startsWith('http') ? faviconPath : new URL(faviconPath, pageUrl).href;
      }
    } catch (err: unknown) { // Fixed: Changed err: Error to err: unknown
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Failed to fetch favicon for ${pageUrl}: ${message}`);
    }
    return `https://${new URL(pageUrl).hostname}/favicon.ico`; // Fallback
  };

  useEffect(() => {
    if (containerRef.current) {
      console.log(`Webview container for tab ${tab.id} dimensions:`, {
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, [tab.id, active]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (webview) {
      console.log(`Webview ${tab.id} initialized`, { src: webview.src, readyState: webview.readyState });

      const handleStartLoading = () => {
        console.log(`Webview ${tab.id} started loading: ${webview.src}`);
        setTabs((prev) =>
          prev.map((t) => (t.id === tab.id ? { ...t, title: 'Loading...' } : t))
        );
      };

      const handleTitleUpdated = (e: WebViewPageTitleUpdatedEvent) => {
        console.log(`Webview ${tab.id} title updated to: ${e.title}`);
        setTabs((prev) =>
          prev.map((t) => (t.id === tab.id ? { ...t, title: e.title } : t))
        );
      };

      const handleNavigate = async (e: WebViewDidNavigateEvent) => {
        console.log(`Webview ${tab.id} navigated to: ${e.url}`);
        const favicon = await getFaviconUrl(e.url);
        if (!tab.isNew) {
          setTabs((prev) =>
            prev.map((t) =>
              t.id === tab.id ? { ...t, url: e.url, favicon } : t
            )
          );
        }
        if (tab.url === 'https://informs.miamidade.gov/psc/EIH91PRD/EMPLOYEE/EMPL/c/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?&') {
          window.electronAPI.ipc.send('webview-ready', tab.id, e.url);
        }
      };

      const handleFailLoad = (e: WebViewDidFailLoadEvent) => {
        console.error(`Webview ${tab.id} failed to load: ${e.errorDescription} (Code: ${e.errorCode})`, { url: e.validatedURL });
      };

      webview.addEventListener('did-start-loading', handleStartLoading);
      webview.addEventListener('page-title-updated', handleTitleUpdated as EventListener);
      webview.addEventListener('did-navigate', handleNavigate as unknown as EventListener); // Fixed: Added unknown cast
      webview.addEventListener('did-fail-load', handleFailLoad as EventListener);

      return () => {
        webview.removeEventListener('did-start-loading', handleStartLoading);
        webview.removeEventListener('page-title-updated', handleTitleUpdated as EventListener);
        webview.removeEventListener('did-navigate', handleNavigate as unknown as EventListener); // Fixed: Added unknown cast
        webview.removeEventListener('did-fail-load', handleFailLoad as EventListener);
      };
    }
  }, [tab.id, tab.isNew, tab.url, setTabs]);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{ display: active ? 'block' : 'none', backgroundColor: '#000' }}
    >
      <webview
        ref={(ref) => {
          webviewRef.current = ref as ElectronWebview | null;
          onWebviewRef(tab.id)(ref as ElectronWebview | null);
        }}
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