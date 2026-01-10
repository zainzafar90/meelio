interface ImportMetaEnv {
  VITE_CDN_URL: string;
  VITE_DEV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    PLASMO_PUBLIC_CDN_URL: string;
    PLASMO_PUBLIC_DEV: string;
  }
}
