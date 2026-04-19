import { createBearerAuthClient } from "@repo/api-client/auth-bearer";

import { bearerStore } from "./bearer-store";

const API_URL = (import.meta.env.WXT_API_URL as string | undefined) ?? "http://localhost:8787";

export const authClient = createBearerAuthClient({
  baseURL: API_URL,
  getToken: () => bearerStore.getToken(),
  setToken: (token) => bearerStore.setToken(token),
});

export async function signOut(): Promise<void> {
  try {
    await authClient.signOut();
  } finally {
    await bearerStore.clearToken();
  }
}
