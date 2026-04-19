import { createAuthClient } from "better-auth/client";

export type BearerAuthClientConfig = {
  baseURL: string;
  /**
   * Sync OR async getter for the stored bearer token.
   * Extension: chrome.storage.local.
   * Mobile: iOS Keychain / Android Keystore.
   *
   * Initial token storage happens OUTSIDE this client — extension code
   * stores it from the chrome.runtime.sendMessage handoff (Chunk 7), or
   * mobile from the deep-link callback. This client only handles in-flight
   * token refresh via setToken below.
   */
  getToken: () => string | null | Promise<string | null>;
  /** Called when an authenticated response includes a refreshed token. */
  setToken: (token: string) => void | Promise<void>;
  /** Called after sign-out — clear local storage. */
  clearToken: () => void | Promise<void>;
};

// ReturnType alias declared first so the function can reference it.
// Better Auth's inferred type is too deep to inline — this avoids TS2742.
type _BearerAuthClientReturn = ReturnType<typeof createAuthClient>;

export function createBearerAuthClient(config: BearerAuthClientConfig): _BearerAuthClientReturn {
  // Better Auth's Bearer token type requires string | undefined (not null).
  // We normalise null → undefined at the call site.
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
        // Persist refreshed token if Better Auth ships one in the response header.
        const refreshed = ctx.response.headers.get("set-auth-token");
        if (refreshed) await config.setToken(refreshed);
      },
    },
  });

  // Wrap signOut so local storage is cleared regardless of server response.
  // (Server delete is best-effort; we always clear locally to avoid orphan UI state.)
  const originalSignOut = client.signOut;
  const wrappedSignOut: typeof originalSignOut = async (...args) => {
    try {
      return await originalSignOut(...args);
    } finally {
      await config.clearToken();
    }
  };

  return Object.assign(client, { signOut: wrappedSignOut });
}

export type BearerAuthClient = ReturnType<typeof createBearerAuthClient>;
