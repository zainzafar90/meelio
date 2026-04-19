/**
 * chrome.storage.local-backed accessor for the Better Auth bearer token and
 * the pending handoff nonce. Both values live outside the existing zustand
 * `useAuthStore` (which still creates a guest UUID user) so the two systems
 * can coexist while bearer auth rolls out.
 */
const TOKEN_KEY = "meelio_auth_token";
const NONCE_KEY = "meelio_pending_auth_nonce";

export const bearerStore = {
  async getToken(): Promise<string | null> {
    const result = await chrome.storage.local.get(TOKEN_KEY);
    return (result[TOKEN_KEY] as string | undefined) ?? null;
  },
  async setToken(token: string): Promise<void> {
    await chrome.storage.local.set({ [TOKEN_KEY]: token });
  },
  async clearToken(): Promise<void> {
    await chrome.storage.local.remove(TOKEN_KEY);
  },
  async getPendingNonce(): Promise<string | null> {
    const result = await chrome.storage.local.get(NONCE_KEY);
    return (result[NONCE_KEY] as string | undefined) ?? null;
  },
  async setPendingNonce(nonce: string): Promise<void> {
    await chrome.storage.local.set({ [NONCE_KEY]: nonce });
  },
  async clearPendingNonce(): Promise<void> {
    await chrome.storage.local.remove(NONCE_KEY);
  },
};
