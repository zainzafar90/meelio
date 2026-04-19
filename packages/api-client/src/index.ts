// packages/api-client/src/index.ts

/**
 * Hand-rolled API client for the Meelio backend (private repo: meelio-api).
 *
 * The API source of truth lives at github.com/zainzafar90/meelio-api.
 * Types here are intentionally small and maintained manually — keep in sync
 * with the actual server routes.
 */

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  userId: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  clientType: "web" | "extension" | "mobile";
  createdAt: string;
  updatedAt: string;
};

export type ApiBaseConfig = {
  baseUrl: string;
  /** For bearer-based clients; web (cookie) leaves this undefined. */
  getBearerToken?: () => string | null | Promise<string | null>;
};

/**
 * Minimal typed client for the Meelio API. Wraps fetch with the right
 * credentials mode and bearer header logic.
 */
export function createApiClient(config: ApiBaseConfig) {
  const fetchWithAuth = async (path: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (config.getBearerToken) {
      const token = await config.getBearerToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(`${config.baseUrl}${path}`, {
      ...init,
      credentials: config.getBearerToken ? "omit" : "include",
      headers,
    });
  };

  return {
    health: async () => {
      const res = await fetchWithAuth("/health");
      if (!res.ok) throw new Error(`health failed: ${res.status}`);
      return res.json() as Promise<{ ok: true; t: string }>;
    },
    me: async () => {
      const res = await fetchWithAuth("/me");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`/me failed: ${res.status}`);
      return res.json() as Promise<{ user: User; session: Session }>;
    },
    /**
     * Mints a bearer token for the requested client type. Caller must be
     * authenticated via the web session cookie. Returns the new bearer.
     */
    mintToken: async (purpose: "extension" | "mobile") => {
      const res = await fetchWithAuth("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose }),
      });
      if (!res.ok) throw new Error(`mintToken failed: ${res.status}`);
      return res.json() as Promise<{ token: string }>;
    },
  };
}
