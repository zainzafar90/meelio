import { bearerStore } from "./bearer-store";

const WEB_URL = import.meta.env.WXT_WEB_URL ?? "http://localhost:4000";

/**
 * Open the web handoff page in a popup window so the page can call
 * window.close() once the bearer is sent. Pattern is "Option B" from
 * the v1 auth plan — keeps the user on the new tab the whole time.
 */
export async function startHandoff(): Promise<void> {
  const nonce = generateNonce();
  await bearerStore.setPendingNonce(nonce);
  const url = new URL(`${WEB_URL}/auth/extension`);
  url.searchParams.set("ext_id", chrome.runtime.id);
  url.searchParams.set("nonce", nonce);
  await chrome.windows.create({
    url: url.toString(),
    type: "popup",
    width: 500,
    height: 700,
  });
}

export type IncomingMessage =
  | { type: "AUTH_TOKEN"; token: string; nonce: string }
  | { type: string; [key: string]: unknown };

export type ExternalMessageListener = (
  msg: IncomingMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => boolean | undefined;

/**
 * Register the externally-connectable listener on the background script.
 * Returns the listener so callers (mostly tests) can detach it.
 *
 * `onSuccess` runs after the token is persisted and the nonce is cleared —
 * useful for broadcasting MEELIO_AUTH_STATE_CHANGED to listening pages.
 */
export function registerHandoffListener(
  onSuccess?: () => void
): ExternalMessageListener {
  const listener: ExternalMessageListener = (msg, sender, sendResponse) => {
    if (msg.type !== "AUTH_TOKEN") return undefined;
    void (async () => {
      const expected = await bearerStore.getPendingNonce();
      if (!expected || expected !== msg.nonce) {
        sendResponse({ ok: false, error: "nonce_mismatch" });
        return;
      }
      const authMsg = msg as Extract<
        IncomingMessage,
        { type: "AUTH_TOKEN" }
      >;
      await bearerStore.setToken(authMsg.token);
      await bearerStore.clearPendingNonce();
      onSuccess?.();
      sendResponse({ ok: true });

      // Close the popup window the page is in. window.close() from the page
      // is unreliable for chrome.windows.create popups — Chromium often
      // refuses. Closing from the extension side is the robust pattern.
      const windowId = sender.tab?.windowId;
      if (typeof windowId === "number") {
        try {
          await chrome.windows.remove(windowId);
        } catch {
          // Window already closed, or user closed it manually — ignore.
        }
      }
    })();
    // signal async sendResponse so Chrome keeps the channel open
    return true;
  };
  chrome.runtime.onMessageExternal.addListener(listener);
  return listener;
}

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
