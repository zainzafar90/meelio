export interface CalendarTokenStatus {
  hasToken: boolean;
  accessToken?: string | null;
  expiresAt?: string | null;
}

export interface TokenInitializerDeps {
  fetchStatus: () => Promise<{ data: CalendarTokenStatus }>;
  setToken: (token: string, expiresAt: number) => void;
  now: () => number;
}

/** Fetch token status and update store when available. */
export async function initializeCalendarToken({
  fetchStatus,
  setToken,
  now,
}: TokenInitializerDeps): Promise<void> {
  const response = await fetchStatus();
  const { hasToken, accessToken, expiresAt } = response.data;
  if (!hasToken || !accessToken) return;
  const expiry = expiresAt ? new Date(expiresAt).getTime() : now() + 3600000;
  setToken(accessToken, expiry);
}

export interface OAuthCallbackOptions {
  search: string;
  pathname: string;
  replaceUrl: (url: string) => void;
  onConnected: () => void;
  onError: (message: string) => void;
}

/** Parse OAuth callback params and trigger handlers. */
export function handleCalendarOAuthCallback({
  search,
  pathname,
  replaceUrl,
  onConnected,
  onError,
}: OAuthCallbackOptions): void {
  const params = new URLSearchParams(search);
  const status = params.get("calendar");
  if (!status) return;
  replaceUrl(pathname);
  if (status === "connected") {
    onConnected();
  } else if (status === "error") {
    onError(params.get("error") ?? "unknown");
  }
}

import { useEffect } from "react";
import { fetchCalendarEvents } from "../api/google-calendar.api";
import { getCalendarTokenStatus } from "../api/calendar.api";
import { useCalendarStore } from "../stores";
import { useDockStore } from "../stores/dock.store";

/** Prepare calendar state and handle OAuth callbacks. */
export const useCalendarInitialization = (): void => {
  const { token, setToken, loadEvents } = useCalendarStore();
  const { setCalendarVisible } = useDockStore();

  const init = () =>
    initializeCalendarToken({
      fetchStatus: getCalendarTokenStatus,
      setToken,
      now: Date.now,
    });

  useEffect(() => {
    handleCalendarOAuthCallback({
      search: window.location.search,
      pathname: window.location.pathname,
      replaceUrl: (url) => window.history.replaceState({}, "", url),
      onConnected: () => {
        setCalendarVisible(false);
        void init();
      },
      onError: (msg) => console.error("Calendar connection failed:", msg),
    });
    if (!token) void init();
  }, []);

  useEffect(() => {
    if (token) loadEvents(fetchCalendarEvents);
  }, [token, loadEvents]);
};
