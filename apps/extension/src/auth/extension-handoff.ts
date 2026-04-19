import { bearerStore } from "./bearer-store";

const WEB_URL = (import.meta.env.WXT_WEB_URL as string | undefined) ?? "http://localhost:4000";

export async function startHandoff(): Promise<void> {
  const nonce = randomHex(16);
  await bearerStore.setPendingNonce(nonce);
  const url = new URL(`${WEB_URL}/auth/extension`);
  url.searchParams.set("ext_id", chrome.runtime.id);
  url.searchParams.set("nonce", nonce);
  await chrome.windows.create({ url: url.toString(), type: "popup", width: 500, height: 700 });
}

type AuthTokenMessage = { type: "AUTH_TOKEN"; token: string; nonce: string };
type IncomingMessage = { type?: string; token?: unknown; nonce?: unknown };

type Listener = (
  msg: IncomingMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | undefined;

export function registerHandoffListener(onSuccess?: () => void): Listener {
  const listener: Listener = (msg, sender, sendResponse) => {
    if (!isAuthToken(msg)) return undefined;

    void handleToken(msg, sender).then((ok) => {
      sendResponse(ok ? { ok: true } : { ok: false, error: "nonce_mismatch" });
      if (ok) onSuccess?.();
    });
    return true;
  };
  chrome.runtime.onMessageExternal.addListener(listener);
  return listener;
}

async function handleToken(msg: AuthTokenMessage, sender: chrome.runtime.MessageSender): Promise<boolean> {
  const expected = await bearerStore.getPendingNonce();
  // Don't clear the pending nonce on mismatch — legitimate retries from the same handoff session must still succeed.
  if (!expected || expected !== msg.nonce) return false;

  await bearerStore.setToken(msg.token);
  await bearerStore.clearPendingNonce();

  const windowId = sender.tab?.windowId;
  if (typeof windowId === "number") {
    chrome.windows.remove(windowId).catch(() => undefined);
  }
  return true;
}

function isAuthToken(msg: IncomingMessage): msg is AuthTokenMessage {
  return msg.type === "AUTH_TOKEN" && typeof msg.token === "string" && typeof msg.nonce === "string";
}

function randomHex(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
