import { createAuthClient } from "better-auth/client";

export type BearerAuthClientConfig = {
  baseURL: string;
  getToken: () => string | null | Promise<string | null>;
  setToken: (token: string) => void | Promise<void>;
  clearToken: () => void | Promise<void>;
};

// Aliased to avoid TS2742 (Better Auth's inferred return type isn't portable).
type _BearerAuthClientReturn = ReturnType<typeof createAuthClient>;

export function createBearerAuthClient(config: BearerAuthClientConfig): _BearerAuthClientReturn {
  const getTokenForAuth = async (): Promise<string | undefined> => {
    const t = await config.getToken();
    return t ?? undefined;
  };

  const client = createAuthClient({
    baseURL: config.baseURL,
    fetchOptions: {
      credentials: "omit",
      auth: {
        type: "Bearer",
        token: getTokenForAuth,
      },
      onSuccess: async (ctx) => {
        // `set-auth-token` is Better Auth's refresh-token response header.
        const refreshed = ctx.response.headers.get("set-auth-token");
        if (refreshed) await config.setToken(refreshed);
      },
    },
  });

  const originalSignOut = client.signOut;
  const signOutAndClearLocal: typeof originalSignOut = async (...args) => {
    try {
      return await originalSignOut(...args);
    } finally {
      await config.clearToken();
    }
  };

  return Object.assign(client, { signOut: signOutAndClearLocal });
}

export type BearerAuthClient = ReturnType<typeof createBearerAuthClient>;
