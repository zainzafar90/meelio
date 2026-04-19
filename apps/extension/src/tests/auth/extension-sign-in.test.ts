import { beforeEach, describe, expect, it, vi } from "vitest";

// Manual chrome shim — see bearer-store.test.ts for the rationale (wxt/testing
// fakeBrowser conflicts with the workspace Vite version).
const storage = new Map<string, unknown>();
const externalListeners: Array<(...args: unknown[]) => unknown> = [];

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
  runtime: {
    id: "test-ext-id",
    onMessageExternal: {
      addListener: (fn: (...args: unknown[]) => unknown) => {
        externalListeners.push(fn);
      },
      removeListener: (fn: (...args: unknown[]) => unknown) => {
        const idx = externalListeners.indexOf(fn);
        if (idx >= 0) externalListeners.splice(idx, 1);
      },
    },
  },
};

import { bearerStore } from "../../auth/bearer-store";
import { registerSignInListener } from "../../auth/extension-sign-in";

describe("registerSignInListener", () => {
  beforeEach(() => {
    storage.clear();
    externalListeners.length = 0;
  });

  it("registers itself on chrome.runtime.onMessageExternal", () => {
    registerSignInListener();
    expect(externalListeners).toHaveLength(1);
  });

  it("rejects when nonce doesn't match the stored sign-in nonce", async () => {
    await bearerStore.setSignInNonce("real-nonce");
    const listener = registerSignInListener();

    const sendResponse = vi.fn();
    listener(
      { type: "AUTH_TOKEN", token: "t", nonce: "wrong-nonce" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );
    // Allow the promise inside the listener to settle.
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      error: "nonce_mismatch",
    });
    expect(await bearerStore.getToken()).toBeNull();
    // Sign-in nonce must NOT be cleared — a nonce-mismatch is suspicious and
    // we want subsequent legitimate retries to still work.
    expect(await bearerStore.getSignInNonce()).toBe("real-nonce");
  });

  it("rejects when no sign-in nonce is stored", async () => {
    const listener = registerSignInListener();

    const sendResponse = vi.fn();
    listener(
      { type: "AUTH_TOKEN", token: "t", nonce: "anything" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      error: "nonce_mismatch",
    });
    expect(await bearerStore.getToken()).toBeNull();
  });

  it("accepts when nonce matches and stores the token", async () => {
    await bearerStore.setSignInNonce("good-nonce");
    const listener = registerSignInListener();

    const sendResponse = vi.fn();
    listener(
      { type: "AUTH_TOKEN", token: "t-xyz", nonce: "good-nonce" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
    expect(await bearerStore.getToken()).toBe("t-xyz");
    expect(await bearerStore.getSignInNonce()).toBeNull();
  });

  it("ignores non-AUTH_TOKEN messages", () => {
    const listener = registerSignInListener();
    const sendResponse = vi.fn();
    const result = listener(
      { type: "SOMETHING_ELSE" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );
    expect(result).toBeUndefined();
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it("invokes onSuccess after persisting a valid sign-in", async () => {
    await bearerStore.setSignInNonce("ok-nonce");
    const onSuccess = vi.fn();
    const listener = registerSignInListener(onSuccess);

    listener(
      { type: "AUTH_TOKEN", token: "tok", nonce: "ok-nonce" },
      {} as chrome.runtime.MessageSender,
      vi.fn()
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
