import { bearerStore } from "./bearer-store";

const WEB_URL = import.meta.env.WXT_WEB_URL ?? "http://localhost:4000";

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

export function registerHandoffListener(
  onSuccess?: () => void
): ExternalMessageListener {
  const listener: ExternalMessageListener = (msg, sender, sendResponse) => {
    if (msg.type !== "AUTH_TOKEN") return undefined;
    void (async () => {
      const expected = await bearerStore.getPendingNonce();
      if (!expected || expected !== msg.nonce) {
        // Do NOT clear the pending nonce on mismatch — a legitimate retry
        // from the same handoff session must still be able to succeed.
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

      await closeSenderWindow(sender);
    })();
    return true;
  };
  chrome.runtime.onMessageExternal.addListener(listener);
  return listener;
}

async function closeSenderWindow(sender: chrome.runtime.MessageSender): Promise<void> {
  const windowId = sender.tab?.windowId;
  if (typeof windowId !== "number") return;
  try {
    await chrome.windows.remove(windowId);
  } catch {
    // Already closed by the user or by the page itself.
  }
}

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
