import { useEffect, useState } from "react";

import { bearerStore } from "./bearer-store";

const API_URL = (import.meta.env.WXT_API_URL ?? "http://localhost:8787") as string;

export function useBearerAuth(): { hasToken: boolean | null } {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const token = await bearerStore.getToken();
      if (cancelled) return;

      if (!token) {
        setHasToken(false);
        return;
      }

      setHasToken(true);

      try {
        const res = await fetch(`${API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401) {
          await bearerStore.clearToken();
          if (!cancelled) setHasToken(false);
        }
      } catch {
        // Network error: leave optimistic state; next API call will retry.
      }
    };

    void refresh();

    const listener = (msg: { type?: string }) => {
      if (msg && msg.type === "MEELIO_AUTH_STATE_CHANGED") void refresh();
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      cancelled = true;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  return { hasToken };
}
