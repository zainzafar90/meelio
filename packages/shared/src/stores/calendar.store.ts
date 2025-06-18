import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CalendarEvent } from "../api/google-calendar.api";

export interface CalendarState {
  token: string | null;
  expiresAt: number | null;
  events: CalendarEvent[];
  eventsLastFetched: number | null;
  nextEvent: CalendarEvent | null;
  setToken: (token: string, expiresAt: number) => void;
  clearCalendar: () => void;
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
 * Store for Google Calendar data and authentication
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
        const { token } = get();
        if (!token) return;

        try {
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
        } catch (error) {
          console.error('Failed to load events in store:', error);
        }
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
      name: "meelio:local:calendar",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);