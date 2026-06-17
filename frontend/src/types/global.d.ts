// Global TypeScript declarations

declare global {
  interface Window {
    // Add any global window properties here
  }
}

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_API_URL?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

export {};

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

// Allow ldrs custom elements
declare namespace JSX {
  interface IntrinsicElements {
    'l-waveform': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      size?: string | number;
      stroke?: string | number;
      speed?: string | number;
      color?: string;
    };
  }
}
