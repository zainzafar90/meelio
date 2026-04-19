import { createBearerAuthClient } from "@repo/api-client/auth-bearer";

import { bearerStore } from "./bearer-store";

export function createAuth(baseURL: string) {
  const client = createBearerAuthClient({
    baseURL,
    getToken: () => bearerStore.getToken(),
    setToken: (token) => bearerStore.setToken(token),
  });

  const signOut = async (): Promise<void> => {
    try {
      await client.signOut();
    } finally {
      await bearerStore.clearToken();
    }
  };

  return { client, signOut };
}

export type Auth = ReturnType<typeof createAuth>;
