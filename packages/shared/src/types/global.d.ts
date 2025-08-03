// TODO: fix the imports and use proper types
interface ImportMetaEnv {
  VITE_SERVER_URL: string;
  VITE_CDN_URL: string;
  VITE_LEMON_SQUEEZY_MONTHLY_VARIANT_ID: string;
  VITE_LEMON_SQUEEZY_YEARLY_VARIANT_ID: string;
  VITE_LEMON_SQUEEZY_LIFETIME_VARIANT_ID: string;
  VITE_APP_PUBLIC_POSTHOG_KEY: string;
  VITE_APP_PUBLIC_POSTHOG_HOST: string;
  VITE_DEV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    PLASMO_PUBLIC_SERVER_URL: string;
    PLASMO_PUBLIC_LEMON_SQUEEZY_MONTHLY_VARIANT_ID: string;
    PLASMO_PUBLIC_LEMON_SQUEEZY_YEARLY_VARIANT_ID: string;
    PLASMO_PUBLIC_LEMON_SQUEEZY_LIFETIME_VARIANT_ID: string;
    PLASMO_PUBLIC_POSTHOG_KEY: string;
    PLASMO_PUBLIC_POSTHOG_HOST: string;
    PLASMO_PUBLIC_DEV: string;
  }
}
