interface ElectronAPI {
  launchApp: (cmd: string) => Promise<void>;
  getConfig: () => Promise<{
    apps: { iconPath?: string; name: string; command: string; icon?: string }[];
    favorites: { [folder: string]: { name: string; url: string; favicon?: string }[] };
    itdTools: {
      buttonOrder: string[];
      visibleITDButtons: string[];
      appsOrder: string[];
      visibleApps: string[];
      isEditMode: boolean;
      buttonBackgroundColor: string;
      isDarkMode: boolean;
      buttonSize: 'small' | 'medium' | 'large';
    };
    history: { url: string; timestamp: string }[];
    sidebarCollapsed: boolean;
    createdAt: string;
  }>;
  saveConfig: (config: any) => Promise<boolean>;
  saveFavorites: (favorites: { [folder: string]: { name: string; url: string; favicon?: string }[] }) => Promise<boolean>;
  saveHistory: (history: { url: string; timestamp: string }[]) => Promise<void>;
  getHistory: () => Promise<{ url: string; timestamp: string }[]>;
  ipc: {
    on: (channel: string, fn: (...args: any[]) => void) => void;
    off: (channel: string, fn: (...args: any[]) => void) => void;
  };
  onNewTab: (callback: (url: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}