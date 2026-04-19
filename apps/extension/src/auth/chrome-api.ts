export function openPopupWindow(url: string, width = 500, height = 700): Promise<chrome.windows.Window> {
  return chrome.windows.create({ url, type: "popup", width, height });
}

export function closeWindow(windowId: number): Promise<void> {
  return chrome.windows.remove(windowId).catch(() => undefined);
}

export function broadcastRuntimeMessage(message: unknown): Promise<void> {
  return chrome.runtime.sendMessage(message).then(() => undefined).catch(() => undefined);
}

export function generateNonce(byteLength = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
