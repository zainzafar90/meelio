import { bearerStore } from "./bearer-store";

export async function startSignIn(webUrl: string) {
  const nonce = randomHex(16);
  await bearerStore.setSignInNonce(nonce);

  const url = new URL(`${webUrl}/auth/extension`);
  url.searchParams.set("ext_id", chrome.runtime.id);
  url.searchParams.set("nonce", nonce);

  await chrome.windows.create({
    url: url.toString(),
    type: "popup",
    width: 500,
    height: 700,
  });
}

export function registerSignInListener(onSuccess?: () => void) {
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

  const expected = await bearerStore.getSignInNonce();
  // Don't clear the sign-in nonce on mismatch — legitimate retries from the same sign-in attempt must still succeed.
  if (expected !== msg.nonce) return false;

  await bearerStore.setToken(msg.token);
  await bearerStore.clearSignInNonce();

  if (sender.tab?.windowId) {
    chrome.windows.remove(sender.tab.windowId).catch(() => undefined);
  }
  return true;
}

function randomHex(byteLength: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
