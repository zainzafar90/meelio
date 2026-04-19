import { createAuthClient } from "better-auth/client";

export type BearerAuthClientConfig = {
  baseURL: string;
  getToken: () => string | null | Promise<string | null>;
  setToken: (token: string) => void | Promise<void>;
};

export function createBearerAuthClient(config: BearerAuthClientConfig) {
  return createAuthClient({
    baseURL: config.baseURL,
    fetchOptions: {
      credentials: "omit",
      auth: {
        type: "Bearer",
        token: async () => (await config.getToken()) ?? undefined,
      },
      onSuccess: async (ctx) => {
        const refreshed = ctx.response.headers.get("set-auth-token");
        if (refreshed) await config.setToken(refreshed);
      },
    },
  });
}

export type BearerAuthClient = ReturnType<typeof createBearerAuthClient>;
