import { createAuthClient } from "better-auth/client";

export type WebAuthClientConfig = {
  baseURL: string;
};

// ReturnType alias declared first so the function can reference it.
// Better Auth's inferred type is too deep to inline — this avoids TS2742.
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
