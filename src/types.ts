export interface Favorite {
  name: string;
  url: string;
  favicon?: string;
}

export interface Favorites {
  [folder: string]: Favorite[];
}

export interface HistoryEntry {
  url: string;
  timestamp: string;
}

export interface AppConfig {
  name: string;
  command: string;
  iconPath?: string;
  icon?: string;
}

export interface ITDButton {
  id: string;
  text: string;
  url?: string;
  submenu?: { id: string; text: string; url: string }[];
}

export interface ITDTools {
  appsOrder: string[];
  visibleApps: string[];
  buttonOrder: string[];
  visibleITDButtons: string[];
  isEditMode: boolean;
  navBackgroundColor?: string;
  buttonBackgroundColor?: string;
  isDarkMode: boolean;
  buttonSize: 'small' | 'medium' | 'large';
}

export interface Config {
  sidebarCollapsed: boolean;
  apps: AppConfig[];
  favorites: Favorites;
  itdTools: ITDTools;
  history: HistoryEntry[];
  createdAt: string;
}

export interface Tab {
  id: number;
  title: string;
  url: string;
  isNew?: boolean;
}

export interface ElectronWebview extends HTMLWebViewElement {
  loadURL: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  src: string;
  readyState: string;
  addEventListener<K extends keyof WebviewEventMap>(
    type: K,
    listener: (this: ElectronWebview, ev: WebviewEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof WebviewEventMap>(
    type: K,
    listener: (this: ElectronWebview, ev: WebviewEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
}

interface WebviewEventMap {
  'page-title-updated': WebViewPageTitleUpdatedEvent;
  'did-navigate': WebViewDidNavigateEvent;
  'did-fail-load': WebViewDidFailLoadEvent;
  'did-start-loading': Event;
}

export interface WebViewPageTitleUpdatedEvent extends Event {
  title: string;
}

export interface WebViewDidNavigateEvent extends Event {
  url: string;
}

export interface WebViewDidFailLoadEvent extends Event {
  errorDescription: string;
  errorCode: number;
  validatedURL: string;
}

export interface ElectronAPI {
  launchApp: (cmd: string) => Promise<void>;
  getConfig: () => Promise<Config>;
  saveConfig: (config: Config) => Promise<boolean>;
  saveFavorites: (favorites: Favorites) => Promise<boolean>;
  saveHistory: (history: HistoryEntry[] | string) => Promise<void>;
  getHistory: () => Promise<HistoryEntry[]>;
  ipc: {
    on: (channel: string, fn: (...args: any[]) => void) => void;
    off: (channel: string, fn: (...args: any[]) => void) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
    once: (channel: string, fn: (...args: any[]) => void) => void;
  };
  onNewTab: (callback: (url: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLWebViewElement> & {
          src?: string;
          style?: React.CSSProperties;
          partition?: string;
          allowpopups?: boolean;
          preload?: string;
          ref?: React.RefObject<HTMLWebViewElement>;
          className?: string;
        },
        HTMLWebViewElement
      >;
    }
  }
}