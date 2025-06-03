export {};

declare global {
  interface Window {
    electronAPI: {
      getHistory(): unknown;
      getConfig(): Promise<{
        sidebarCollapsed: boolean;
        favorites: { name: string; url: string }[];
        apps: { name: string; command: string }[];
        createdAt: string;
      }>;
      launchApp: (cmd: string) => void;
      showContextMenu: () => void;
      saveFavorite: (fav: { name: string; url: string }) => Promise<boolean>;
      saveFavorites?: (favorites: { name: string; url: string }[]) => void;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLWebViewElement> & {
          src?: string;
          style?: React.CSSProperties;
          ref?: React.RefObject<HTMLWebViewElement>;
          onDidFinishLoad?: () => void;
        },
        HTMLWebViewElement
      >;
    }
  }
}
