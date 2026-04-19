import { beforeEach, describe, expect, it } from "vitest";

// Manual chrome.storage.local mock — wxt/testing's fakeBrowser depends on
// WxtVitest plugin which conflicts with the workspace's vite version.
const storage = new Map<string, unknown>();
// @ts-expect-error - test-only chrome shim
globalThis.chrome = {
  storage: {
    local: {
      get: async (key: string) => ({ [key]: storage.get(key) }),
      set: async (obj: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(obj)) storage.set(k, v);
      },
      remove: async (key: string) => {
        storage.delete(key);
      },
    },
  },
};

import { bearerStore } from "../../auth/bearer-store";

describe("bearerStore", () => {
  beforeEach(() => storage.clear());

  it("stores and retrieves the bearer token", async () => {
    await bearerStore.setToken("token-abc");
    expect(await bearerStore.getToken()).toBe("token-abc");
  });

  it("returns null when no token is stored", async () => {
    expect(await bearerStore.getToken()).toBeNull();
  });

  it("clears the token", async () => {
    await bearerStore.setToken("token-xyz");
    await bearerStore.clearToken();
    expect(await bearerStore.getToken()).toBeNull();
  });

  it("stores and retrieves a pending nonce, then clears it", async () => {
    await bearerStore.setPendingNonce("nonce-123");
    expect(await bearerStore.getPendingNonce()).toBe("nonce-123");
    await bearerStore.clearPendingNonce();
    expect(await bearerStore.getPendingNonce()).toBeNull();
  });
});
