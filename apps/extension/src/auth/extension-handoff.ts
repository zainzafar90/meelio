import { bearerStore } from "./bearer-store";

const WEB_URL = (import.meta.env.WXT_WEB_URL as string | undefined) ?? "http://localhost:4000";

export async function startHandoff() {
  const nonce = randomHex(16);
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

export function registerHandoffListener(onSuccess?: () => void) {
  const listener = (
    msg: { type?: unknown; token?: unknown; nonce?: unknown },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    if (msg?.type !== "AUTH_TOKEN") return undefined;

    handleAuthToken(msg, sender).then((ok) => {
      sendResponse(ok ? { ok: true } : { ok: false, error: "nonce_mismatch" });
      if (ok) onSuccess?.();
    });
    return true;
  };

  chrome.runtime.onMessageExternal.addListener(listener);
  return listener;
}

async function handleAuthToken(
  msg: { token?: unknown; nonce?: unknown },
  sender: chrome.runtime.MessageSender,
) {
  if (typeof msg.token !== "string" || typeof msg.nonce !== "string") return false;

  const expected = await bearerStore.getPendingNonce();
  // Don't clear pending nonce on mismatch — legitimate retries from the same handoff session must still succeed.
  if (expected !== msg.nonce) return false;

  await bearerStore.setToken(msg.token);
  await bearerStore.clearPendingNonce();

  if (sender.tab?.windowId) {
    chrome.windows.remove(sender.tab.windowId).catch(() => undefined);
  }
  return true;
}

function randomHex(byteLength: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
