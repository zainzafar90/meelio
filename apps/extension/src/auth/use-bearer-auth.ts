import { useEffect, useState } from "react";

import { bearerStore } from "./bearer-store";

const API_URL = (import.meta.env.WXT_API_URL ?? "http://localhost:8787") as string;

/**
 * Bearer auth state for the extension UI.
 *
 * Optimistic + background-validated:
 * - Initial read is local (chrome.storage.local) — no network hop.
 * - If a token exists, hasToken flips to true OPTIMISTICALLY so signed-in
 *   users never see a loading flash on every new tab.
 * - Then a background /api/me call validates the bearer. If the server
 *   returns 401 (session deleted, expired, or revoked), the token is
 *   cleared and hasToken flips to false.
 * - If no token exists, hasToken is false immediately. No network call.
 *
 * Crucially, this hook never *gates* the UI — the new-tab dashboard always
 * renders. This hook only drives small auth-aware affordances (e.g. the
 * floating "Sign in" button).
 */
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

      // Optimistic: assume valid so signed-in UI doesn't flash.
      setHasToken(true);

      // Background validation against /api/me. Don't block UI.
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
        // Network error — leave optimistic state. Real API calls will retry.
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
