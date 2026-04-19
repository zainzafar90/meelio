const STORAGE_KEY = "meelio:auth:ext-handoff";

export type HandoffParams = { extId: string; nonce: string };

export function readHandoffParams(): HandoffParams | null {
  const fromUrl = readFromUrl();
  if (fromUrl) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }
  return readFromSessionStorage();
}

export function clearHandoffParams(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

function readFromUrl(): HandoffParams | null {
  const params = new URL(window.location.href).searchParams;
  const extId = params.get("ext_id");
  const nonce = params.get("nonce");
  return extId && nonce ? { extId, nonce } : null;
}

function readFromSessionStorage(): HandoffParams | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HandoffParams;
  } catch {
    return null;
  }
}
