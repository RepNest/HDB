import React, { useRef } from 'react';
import clsx from 'clsx';
import { Tab, ElectronWebview } from '../types';
import WebviewContainer from './WebviewContainer';

interface WebviewComponentProps {
  tabs: Tab[];
  activeTabId: number;
  zoomLevel: number;
  setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
}

const WebviewComponent: React.FC<WebviewComponentProps> = ({ tabs, activeTabId, zoomLevel, setTabs }) => {
  const webviews = useRef<{ [key: number]: ElectronWebview | null }>({});

  const handleWebviewRef = (id: number) => (ref: ElectronWebview | null) => {
    webviews.current[id] = ref;
  };

  return (
    <div className="flex-1 relative" style={{ minHeight: '0', width: '100%' }}>
      {tabs.map(tab => (
        <WebviewContainer
          key={tab.id}
          tab={tab}
          active={tab.id === activeTabId}
          zoomLevel={zoomLevel}
          onWebviewRef={handleWebviewRef}
          setTabs={setTabs}
        />
      ))}
    </div>
  );
};

export default WebviewComponent;