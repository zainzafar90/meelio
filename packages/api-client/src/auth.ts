import { createAuthClient } from "better-auth/client";

export type WebAuthClientConfig = {
  baseURL: string;
};

// Aliased to avoid TS2742 (Better Auth's inferred return type isn't portable).
type _WebAuthClientReturn = ReturnType<typeof createAuthClient>;

export function createWebAuthClient(config: WebAuthClientConfig): _WebAuthClientReturn {
  return createAuthClient({
    baseURL: config.baseURL,
    fetchOptions: {
      credentials: "include",
    },
  });
}

export type WebAuthClient = ReturnType<typeof createWebAuthClient>;
