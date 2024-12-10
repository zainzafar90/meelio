export type Environment = {
  serverUrl: string;
  lemonSqueezyMonthlyVariantId: string;
  lemonSqueezyYearlyVariantId: string;
  lemonSqueezyLifetimeVariantId: string;
  posthogKey: string;
  posthogHost: string;
  dev: boolean;
};

export class EnvWrapper {
  private static instance: EnvWrapper;
  private envVariables: Environment | null = null;

  private constructor() {}

  static getInstance(): EnvWrapper {
    if (!EnvWrapper.instance) {
      EnvWrapper.instance = new EnvWrapper();
    }
    return EnvWrapper.instance;
  }

  private isExtension() {
    return (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.getManifest
    );
  }

  private getWebEnv(): Environment {
    return {
      // @ts-ignore - Webpack specific
      serverUrl: import.meta.env.VITE_SERVER_URL || "",
      lemonSqueezyMonthlyVariantId:
        // @ts-ignore - Webpack specific
        import.meta.env.VITE_LEMON_SQUEEZY_MONTHLY_VARIANT_ID || "",
      lemonSqueezyYearlyVariantId:
        // @ts-ignore - Webpack specific
        import.meta.env.VITE_LEMON_SQUEEZY_YEARLY_VARIANT_ID || "",
      lemonSqueezyLifetimeVariantId:
        // @ts-ignore - Webpack specific
        import.meta.env.VITE_LEMON_SQUEEZY_LIFETIME_VARIANT_ID || "",
      posthogKey:
        // @ts-ignore - Webpack specific
        import.meta.env.VITE_POSTHOG_KEY || "",
      // @ts-ignore - Webpack specific
      posthogHost: import.meta.env.VITE_POSTHOG_HOST || "",
      // @ts-ignore - Webpack specific
      dev: import.meta.env.DEV || false,
    };
  }

  private getExtensionEnv(): Environment {
    return {
      serverUrl: process.env.PLASMO_PUBLIC_SERVER_URL || "",
      lemonSqueezyMonthlyVariantId:
        process.env.PLASMO_PUBLIC_LEMON_SQUEEZY_MONTHLY_VARIANT_ID || "",
      lemonSqueezyYearlyVariantId:
        process.env.PLASMO_PUBLIC_LEMON_SQUEEZY_YEARLY_VARIANT_ID || "",
      lemonSqueezyLifetimeVariantId:
        process.env.PLASMO_PUBLIC_LEMON_SQUEEZY_LIFETIME_VARIANT_ID || "",
      posthogKey: process.env.PLASMO_PUBLIC_APP_PUBLIC_POSTHOG_KEY || "",
      posthogHost: process.env.PLASMO_PUBLIC_APP_PUBLIC_POSTHOG_HOST || "",
      dev: process.env.PLASMO_PUBLIC_DEV === "true" || false,
    };
  }

  public getEnv(): Environment {
    if (!this.envVariables) {
      this.envVariables = this.isExtension()
        ? this.getExtensionEnv()
        : this.getWebEnv();
    }
    return this.envVariables;
  }
}

// Create a proxy for lazy loading of environment variables
export const env = new Proxy({} as Environment, {
  get(_target, prop) {
    return EnvWrapper.getInstance().getEnv()[prop as keyof Environment];
  },
});
