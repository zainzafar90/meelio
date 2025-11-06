import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CalendarEvent, fetchCalendarEvents } from "../api/google-calendar.api";
import { getCalendarToken } from "../api/calendar.api";
import { useAuthStore } from "../stores/auth.store";
import {
  getEventStartDate,
  getEventEndDate,
  getMinutesUntilEvent
} from "../utils/calendar-date.utils";

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
  lastSuccessfulSync: number | null;
  setToken: (token: string, expiresAt: number) => void;
  setConnectedEmail: (email: string) => void;
  clearCalendar: () => void;
  initializeToken: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loadEvents: (force?: boolean) => Promise<void>;
  getNextEvent: () => CalendarEvent | null;
  getMinutesUntilNextEvent: () => number | null;
  getSmartCacheDuration: () => number;
  updateLastSuccessfulSync: () => void;
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
      lastSuccessfulSync: null,
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
          lastSuccessfulSync: null,
        });
      },
      updateLastSuccessfulSync: () => {
        set({ lastSuccessfulSync: Date.now() });
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
            get().updateLastSuccessfulSync();
          }
        } catch (error) {
          console.error("Failed to initialize calendar token:", error);
          // Don't clear calendar here - let grace period handle it
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

        if (
          !force &&
          eventsLastFetched &&
          Date.now() - eventsLastFetched < cacheDuration
        ) {
          return;
        }

        // Use existing token, don't initialize unnecessarily
        if (!token) {
          return;
        }

        const fetchAndProcessEvents = async (accessToken: string) => {
          const eventsResponse = await fetchCalendarEvents(accessToken);

          const googleEmail = eventsResponse.summary || null;
          if (googleEmail && googleEmail !== get().connectedEmail) {
            set({ connectedEmail: googleEmail });
          }

          const events = eventsResponse.items || [];
          const now = new Date();

          const activeEvents = events
            .filter((event: CalendarEvent) => {
              try {
                const eventEnd = getEventEndDate(event);
                return eventEnd > now;
              } catch (error) {
                console.error("Error parsing event date:", error);
                return false;
              }
            })
            .sort((a: CalendarEvent, b: CalendarEvent) => {
              try {
                const aStart = getEventStartDate(a);
                const bStart = getEventStartDate(b);
                return aStart.getTime() - bStart.getTime();
              } catch (error) {
                console.error("Error sorting events:", error);
                return 0;
              }
            });

          set({
            events,
            eventsLastFetched: Date.now(),
            nextEvent: activeEvents[0] || null,
          });
          get().updateLastSuccessfulSync();
        };

        try {
          await fetchAndProcessEvents(token);
        } catch (error: any) {
          const is401Error = error.message?.includes("401");

          if (is401Error) {
            console.log("Google token expired, attempting refresh...");
            try {
              await get().refreshToken();
              const refreshedToken = get().token;

              if (refreshedToken) {
                await fetchAndProcessEvents(refreshedToken);
                return;
              }
            } catch (refreshError) {
              console.error("Failed to refresh Google token:", refreshError);
            }
          }

          console.error("Failed to load events:", error);

          const ONE_DAY_MS = 24 * 60 * 60 * 1000;
          const now = Date.now();
          const lastSync = get().lastSuccessfulSync;

          if (
            error.message?.includes("401") ||
            error.message?.includes("Failed to fetch events")
          ) {
            if (!lastSync || (now - lastSync) > ONE_DAY_MS) {
              get().clearCalendar();
            } else {
              // Within grace period, keep existing data
              console.log('Calendar sync failed but within 1-hour grace period, keeping existing data');
            }
          }
        }
      },
      getNextEvent: () => {
        return get().nextEvent;
      },
      getMinutesUntilNextEvent: () => {
        const { nextEvent } = get();
        if (!nextEvent) return null;

        return getMinutesUntilEvent(nextEvent);
      },
    }),
    {
      name: "meelio:local:calendar",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
