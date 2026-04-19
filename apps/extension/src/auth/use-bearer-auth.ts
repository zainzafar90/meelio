import { useEffect, useState } from "react";

import { bearerStore } from "./bearer-store";

const API_URL = (import.meta.env.WXT_API_URL as string | undefined) ?? "http://localhost:8787";

export function useBearerAuth(): { hasToken: boolean | null } {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void resolveBearerState().then((next) => {
        if (!cancelled) setHasToken(next);
      });
    };

    refresh();

    const onAuthChanged = (msg: { type?: string }) => {
      if (msg?.type === "MEELIO_AUTH_STATE_CHANGED") refresh();
    };
    chrome.runtime.onMessage.addListener(onAuthChanged);
    return () => {
      cancelled = true;
      chrome.runtime.onMessage.removeListener(onAuthChanged);
    };
  }, []);

  return { hasToken };
}

async function resolveBearerState(): Promise<boolean> {
  const token = await bearerStore.getToken();
  if (!token) return false;
  if (await isTokenValid(token)) return true;
  await bearerStore.clearToken();
  return false;
}

async function isTokenValid(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.status !== 401;
  } catch {
    return true; // network error — treat as valid; next API call will retry
  }
}
