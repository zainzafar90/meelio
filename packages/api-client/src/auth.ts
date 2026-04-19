import { createAuthClient } from "better-auth/client";

export type WebAuthClientConfig = {
  baseURL: string;
};

export function createWebAuthClient(config: WebAuthClientConfig) {
  return createAuthClient({
    baseURL: config.baseURL,
    fetchOptions: { credentials: "include" },
  });
}

export type WebAuthClient = ReturnType<typeof createWebAuthClient>;
