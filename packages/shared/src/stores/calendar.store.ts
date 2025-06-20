import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CalendarEvent } from "../api/google-calendar.api";
import { getCalendarToken } from "../api/calendar.api";
import { useAuthStore } from "../stores/auth.store";

export interface CalendarState {
  token: string | null;
  expiresAt: number | null;
  events: CalendarEvent[];
  eventsLastFetched: number | null;
  nextEvent: CalendarEvent | null;
  setToken: (token: string, expiresAt: number) => void;
  clearCalendar: () => void;
  refreshToken: (
    fetchNewToken: () => Promise<{ token: string; expiresIn: number }>
  ) => Promise<void>;
  loadEvents: (
    fetchEvents: (token: string) => Promise<CalendarEvent[]>
  ) => Promise<void>;
  getNextEvent: () => CalendarEvent | null;
  getMinutesUntilNextEvent: () => number | null;
}

/**
 * Store for Calendar data and authentication
 */
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
      refreshToken: async (fetchNewToken) => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        const { token, expiresAt } = get();
        if (!token || !expiresAt || Date.now() >= expiresAt) {
          const data = await fetchNewToken();
          set({
            token: data.token,
            expiresAt: Date.now() + data.expiresIn * 1000,
          });
        }
      },
      loadEvents: async (fetchEvents) => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        const { token, expiresAt, eventsLastFetched } = get();

        // Skip if events were fetched in the last minute
        if (eventsLastFetched && Date.now() - eventsLastFetched < 60000) {
          return;
        }

        if (!token) {
          console.error("No token available to load events");
          return;
        }

        // Check if token is expired and attempt refresh
        if (expiresAt && Date.now() >= expiresAt) {
          console.warn("Token is expired, attempting to refresh...");
          try {
            const response = await getCalendarToken();

            if (response.data.accessToken && response.data.expiresAt) {
              // Update with refreshed token
              const newExpiresAt = new Date(response.data.expiresAt).getTime();
              set({
                token: response.data.accessToken,
                expiresAt: newExpiresAt,
              });
            } else {
              console.error("Failed to refresh token, clearing calendar");
              get().clearCalendar();
              return;
            }
          } catch (error) {
            console.error("Error refreshing token:", error);
            get().clearCalendar();
            return;
          }
        }

        try {
          const currentToken = get().token; // Get updated token after potential refresh
          const events = await fetchEvents(currentToken!);
          const now = new Date();

          // Find next upcoming event
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
          // If it's a 401, the token is invalid
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
