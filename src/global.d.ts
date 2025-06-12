export {};

declare global {
  interface Window {
    electronAPI: import('./electron').ElectronAPI;
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