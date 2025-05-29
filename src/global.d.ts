export {};

declare global {
  interface Window {
    electronAPI: {
      getConfig(): unknown;
      launchApp: (cmd: string) => void;
      saveFavorite: (fav: { name: string; url: string }) => Promise<boolean>; // ✅ Add this
      showContextMenu: () => void;
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
