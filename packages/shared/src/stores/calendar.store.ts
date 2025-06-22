import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CalendarEvent, fetchCalendarEvents } from "../api/google-calendar.api";
import {
  getCalendarToken,
} from "../api/calendar.api";
import { useAuthStore } from "../stores/auth.store";

export const REFRESH_THRESHOLD_MS = 15 * 60 * 1000;
const BASE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MIN_CACHE_DURATION = 60 * 1000; // 1 minute

export interface CalendarState {
  token: string | null;
  expiresAt: number | null;
  connectedEmail: string | null;
  events: CalendarEvent[];
  eventsLastFetched: number | null;
  nextEvent: CalendarEvent | null;
  setToken: (token: string, expiresAt: number) => void;
  setConnectedEmail: (email: string) => void;
  clearCalendar: () => void;
  initializeToken: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loadEvents: (force?: boolean) => Promise<void>;
  getNextEvent: () => CalendarEvent | null;
  getMinutesUntilNextEvent: () => number | null;
  getSmartCacheDuration: () => number;
}

// Removed shouldRefreshToken - backend handles token refresh automatically

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      connectedEmail: null,
      events: [],
      eventsLastFetched: null,
      nextEvent: null,
      setToken: (token, expiresAt) => {
        set({ token, expiresAt });
      },
      setConnectedEmail: (email) => {
        set({ connectedEmail: email });
      },
      clearCalendar: () => {
        set({
          token: null,
          expiresAt: null,
          connectedEmail: null,
          events: [],
          eventsLastFetched: null,
          nextEvent: null,
        });
      },
      initializeToken: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;

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
        // Backend handles token refresh automatically
        // This method exists for compatibility but delegates to initializeToken
        return get().initializeToken();
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

        // Only load events when calendar features are enabled
        const calendarEnabled = user?.settings?.calendar?.enabled ?? false;
        if (!calendarEnabled) return;

        const { eventsLastFetched, token } = get();
        const cacheDuration = get().getSmartCacheDuration();

        if (!force && eventsLastFetched && Date.now() - eventsLastFetched < cacheDuration) {
          return;
        }

        // Use existing token, don't initialize unnecessarily
        if (!token) {
          return;
        }

        try {
          const eventsResponse = await fetchCalendarEvents(token);
          
          // Extract Google account email from calendar response
          const googleEmail = eventsResponse.summary || null;
          if (googleEmail && googleEmail !== get().connectedEmail) {
            set({ connectedEmail: googleEmail });
          }

          const events = eventsResponse.items || [];
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
