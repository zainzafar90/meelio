import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { CalendarEvent } from "../api/google-calendar.api";

export interface CalendarTokenState {
  token: string | null;
  expiresAt: number | null;
  events: CalendarEvent[];
  eventsLastFetched: number | null;
  nextEvent: CalendarEvent | null;
  setToken: (token: string, expiresAt: number) => void;
  clearToken: () => void;
  refreshToken: (
    fetchNewToken: () => Promise<{ token: string; expiresIn: number }>,
  ) => Promise<void>;
  loadEvents: (
    fetchEvents: (token: string) => Promise<CalendarEvent[]>,
  ) => Promise<void>;
  getNextEvent: () => CalendarEvent | null;
  getMinutesUntilNextEvent: () => number | null;
}

/**
 * Store for Google Calendar token and events
 */
export const useCalendarTokenStore = create<CalendarTokenState>()(
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
      clearToken: () => {
        set({ 
          token: null, 
          expiresAt: null, 
          events: [], 
          eventsLastFetched: null,
          nextEvent: null 
        });
      },
      refreshToken: async (fetchNewToken) => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt || Date.now() >= expiresAt) {
          const data = await fetchNewToken();
          set({ token: data.token, expiresAt: Date.now() + data.expiresIn * 1000 });
        }
      },
      loadEvents: async (fetchEvents) => {
        const { token, eventsLastFetched } = get();
        if (!token) return;
        
        // Check if events were fetched in the last hour (for caching)
        const oneHourAgo = Date.now() - 3600000;
        if (eventsLastFetched && eventsLastFetched > oneHourAgo) {
          return; // Use cached events
        }

        const events = await fetchEvents(token);
        const now = new Date();
        
        // Find next upcoming event
        const futureEvents = events.filter(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date || '');
          return eventStart > now;
        }).sort((a, b) => {
          const aStart = new Date(a.start.dateTime || a.start.date || '');
          const bStart = new Date(b.start.dateTime || b.start.date || '');
          return aStart.getTime() - bStart.getTime();
        });

        set({ 
          events, 
          eventsLastFetched: Date.now(),
          nextEvent: futureEvents[0] || null 
        });
      },
      getNextEvent: () => {
        return get().nextEvent;
      },
      getMinutesUntilNextEvent: () => {
        const { nextEvent } = get();
        if (!nextEvent) return null;
        
        const now = Date.now();
        const eventStart = new Date(nextEvent.start.dateTime || nextEvent.start.date || '');
        const diffMs = eventStart.getTime() - now;
        
        if (diffMs <= 0) return 0;
        return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
      },
    }),
    {
      name: "meelio:local:calendar-token",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
