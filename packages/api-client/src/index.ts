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
  getBearerToken?: () => string | null | Promise<string | null>;
};

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
