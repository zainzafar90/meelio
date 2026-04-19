import { createBearerAuthClient } from "@repo/api-client/auth-bearer";

import { bearerStore } from "./bearer-store";

const API_URL = import.meta.env.WXT_API_URL ?? "http://localhost:8787";

/**
 * Better Auth client wired to chrome.storage.local. The initial token comes
 * from the chrome.runtime.sendMessage handoff (see extension-handoff.ts) —
 * this client only handles in-flight refresh + sign-out.
 */
export const authClient = createBearerAuthClient({
  baseURL: API_URL,
  getToken: () => bearerStore.getToken(),
  setToken: (token) => bearerStore.setToken(token),
  clearToken: () => bearerStore.clearToken(),
});
