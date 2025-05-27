export {};

declare global {
  interface Window {
    electronAPI: {
      launchApp: (cmd: string) => void;
      getConfig: () => {
        sidebarCollapsed: boolean;
        favorites: { name: string; url: string }[];
        apps: { name: string; command: string }[];
        createdAt: string;
      };
    };
  }
}
