export {};

declare global {
  interface Window {
    userConfig: {
      sidebarCollapsed: boolean;
      favorites: { name: string; url: string }[];
      apps: { name: string; command: string }[];
      createdAt: string;
    };
    electronAPI?: {
      getConfig(): unknown;
      launchApp: (cmd: string) => void;
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
