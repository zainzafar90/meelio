export type Environment = {
  cdnUrl: string;
  dev: boolean | string;
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
    return typeof chrome !== "undefined" && chrome.runtime;
  }

  private getWebEnv(): Environment {
    return {
      // @ts-ignore - Vite specific
      cdnUrl: import.meta.env.VITE_CDN_URL || "",
      // @ts-ignore - Vite specific
      dev: import.meta.env.DEV || false,
    };
  }

  private getExtensionEnv(): Environment {
    return {
      cdnUrl: process.env.PLASMO_PUBLIC_CDN_URL || "",
      dev: process.env.PLASMO_PUBLIC_DEV || false,
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
