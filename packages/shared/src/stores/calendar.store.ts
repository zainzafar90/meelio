import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CalendarEvent, fetchCalendarEvents } from "../api/google-calendar.api";
import {
  getCalendarToken,
  fetchCalendarAccessToken,
} from "../api/calendar.api";
import { useAuthStore } from "../stores/auth.store";

export const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
const BASE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MIN_CACHE_DURATION = 60 * 1000; // 1 minute

export interface CalendarState {
  token: string | null;
  expiresAt: number | null;
  events: CalendarEvent[];
  eventsLastFetched: number | null;
  nextEvent: CalendarEvent | null;
  setToken: (token: string, expiresAt: number) => void;
  clearCalendar: () => void;
  initializeToken: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loadEvents: (force?: boolean) => Promise<void>;
  getNextEvent: () => CalendarEvent | null;
  getMinutesUntilNextEvent: () => number | null;
  getSmartCacheDuration: () => number;
}

export function shouldRefreshToken(
  token: string | null,
  expiresAt: number | null,
  now: number,
  thresholdMs = REFRESH_THRESHOLD_MS
): boolean {
  if (!token || !expiresAt) return true;
  const timeUntilExpiry = expiresAt - now;
  const shouldRefresh = timeUntilExpiry <= thresholdMs;

  return shouldRefresh;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      events: [],
      eventsLastFetched: null,
      nextEvent: null,
      setToken: (token, expiresAt) => {
        set({ token, expiresAt });
      },
      clearCalendar: () => {
        set({
          token: null,
          expiresAt: null,
          events: [],
          eventsLastFetched: null,
          nextEvent: null,
        });
      },
      initializeToken: async () => {
        try {
          const response = await getCalendarToken();
          const { accessToken, expiresAt } = response.data;

          if (accessToken && expiresAt) {
            const expiryTime = new Date(expiresAt).getTime();
            set({ token: accessToken, expiresAt: expiryTime });
          }
        } catch (error) {
          console.error("Failed to initialize calendar token:", error);
        }
      },
      refreshToken: async () => {
        const { token, expiresAt } = get();
        const now = Date.now();

        if (!shouldRefreshToken(token, expiresAt, now)) {
          return;
        }

        try {
          const data = await fetchCalendarAccessToken();
          if (data.accessToken && data.expiresAt) {
            set({
              token: data.accessToken,
              expiresAt: data.expiresAt,
            });
          }
        } catch (error) {
          console.error("[refreshToken] Failed:", error);
          get().clearCalendar();
        }
      },

      getSmartCacheDuration: () => {
        const { nextEvent } = get();
        
        if (!nextEvent) {
          return MAX_CACHE_DURATION;
        }

        const now = Date.now();
        const eventStart = new Date(
          nextEvent.start.dateTime || nextEvent.start.date || ""
        ).getTime();
        const timeUntilEvent = eventStart - now;

        if (timeUntilEvent < 15 * 60 * 1000) {
          return MIN_CACHE_DURATION;
        } else if (timeUntilEvent < 60 * 60 * 1000) {
          return BASE_CACHE_DURATION;
        } else {
          return Math.min(MAX_CACHE_DURATION, timeUntilEvent / 4);
        }
      },
      loadEvents: async (force = false) => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        const { eventsLastFetched } = get();
        const cacheDuration = get().getSmartCacheDuration();

        if (!force && eventsLastFetched && Date.now() - eventsLastFetched < cacheDuration) {
          return;
        }

        await get().refreshToken();

        const currentToken = get().token;
        if (!currentToken) {
          console.error("No token available to load events");
          return;
        }

        try {
          const events = await fetchCalendarEvents(currentToken);
          const now = new Date();

          const futureEvents = events
            .filter((event) => {
              const eventStart = new Date(
                event.start.dateTime || event.start.date || ""
              );
              return eventStart > now;
            })
            .sort((a, b) => {
              const aStart = new Date(a.start.dateTime || a.start.date || "");
              const bStart = new Date(b.start.dateTime || b.start.date || "");
              return aStart.getTime() - bStart.getTime();
            });

          set({
            events,
            eventsLastFetched: Date.now(),
            nextEvent: futureEvents[0] || null,
          });
        } catch (error: any) {
          console.error("Failed to load events:", error);
          if (
            error.message?.includes("401") ||
            error.message?.includes("Failed to fetch events")
          ) {
            console.error("Token appears to be invalid, clearing calendar");
            get().clearCalendar();
          }
        }
      },
      getNextEvent: () => {
        return get().nextEvent;
      },
      getMinutesUntilNextEvent: () => {
        const { nextEvent } = get();
        if (!nextEvent) return null;

        const now = Date.now();
        const eventStart = new Date(
          nextEvent.start.dateTime || nextEvent.start.date || ""
        );
        const diffMs = eventStart.getTime() - now;

        if (diffMs <= 0) return 0;

        return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
      },
    }),
    {
      name: "meelio:local:calendar",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
