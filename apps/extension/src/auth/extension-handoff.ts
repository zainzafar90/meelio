import { bearerStore } from "./bearer-store";
import { closeWindow, generateNonce, openPopupWindow } from "./chrome-api";

const WEB_URL = (import.meta.env.WXT_WEB_URL as string | undefined) ?? "http://localhost:4000";

export async function startHandoff(): Promise<void> {
  const nonce = generateNonce();
  await bearerStore.setPendingNonce(nonce);
  const url = new URL(`${WEB_URL}/auth/extension`);
  url.searchParams.set("ext_id", chrome.runtime.id);
  url.searchParams.set("nonce", nonce);
  await openPopupWindow(url.toString());
}

export type AuthTokenMessage = { type: "AUTH_TOKEN"; token: string; nonce: string };
export type IncomingMessage = AuthTokenMessage | { type: string; [key: string]: unknown };

export type ExternalMessageListener = (
  msg: IncomingMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | undefined;

export function registerHandoffListener(onSuccess?: () => void): ExternalMessageListener {
  const listener: ExternalMessageListener = (msg, sender, sendResponse) => {
    if (!isAuthTokenMessage(msg)) return undefined;

    void handleAuthToken(msg, sender)
      .then((result) => {
        if (result === "ok") onSuccess?.();
        sendResponse(result === "ok" ? { ok: true } : { ok: false, error: result });
      });
    return true;
  };

  chrome.runtime.onMessageExternal.addListener(listener);
  return listener;
}

async function handleAuthToken(
  msg: AuthTokenMessage,
  sender: chrome.runtime.MessageSender,
): Promise<"ok" | "nonce_mismatch"> {
  const expected = await bearerStore.getPendingNonce();
  // Do NOT clear pending nonce on mismatch — a legitimate retry must still succeed.
  if (!expected || expected !== msg.nonce) return "nonce_mismatch";

  await bearerStore.setToken(msg.token);
  await bearerStore.clearPendingNonce();
  if (typeof sender.tab?.windowId === "number") {
    await closeWindow(sender.tab.windowId);
  }
  return "ok";
}

function isAuthTokenMessage(msg: IncomingMessage): msg is AuthTokenMessage {
  return msg.type === "AUTH_TOKEN" && typeof (msg as AuthTokenMessage).token === "string" && typeof (msg as AuthTokenMessage).nonce === "string";
}
