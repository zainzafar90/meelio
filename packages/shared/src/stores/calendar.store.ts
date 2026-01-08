import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CalendarEvent } from "../types/calendar.types";
import { fetchICSCalendar, validateICSUrl } from "../utils/calendar-ics.utils";
import {
  getEventStartDate,
  getEventEndDate,
  getMinutesUntilEvent,
} from "../utils/calendar-date.utils";

const BASE_CACHE_DURATION = 5 * 60 * 1000;
const MAX_CACHE_DURATION = 30 * 60 * 1000;
const MIN_CACHE_DURATION = 60 * 1000;

export interface CalendarState {
  icsUrl: string | null;
  events: CalendarEvent[];
  eventsLastFetched: number | null;
  nextEvent: CalendarEvent | null;
  loading: boolean;
  error: string | null;
  setIcsUrl: (url: string | null) => Promise<void>;
  clearCalendar: () => void;
  loadEvents: (force?: boolean) => Promise<void>;
  getNextEvent: () => CalendarEvent | null;
  getMinutesUntilNextEvent: () => number | null;
  getSmartCacheDuration: () => number;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      icsUrl: null,
      events: [],
      eventsLastFetched: null,
      nextEvent: null,
      loading: false,
      error: null,

      setIcsUrl: async (url) => {
        if (url && !validateICSUrl(url)) {
          set({ error: "Invalid calendar URL" });
          return;
        }

        set({ icsUrl: url, error: null });

        if (url) {
          await get().loadEvents(true);
        } else {
          set({ events: [], nextEvent: null, eventsLastFetched: null });
        }
      },

      clearCalendar: () => {
        set({
          icsUrl: null,
          events: [],
          eventsLastFetched: null,
          nextEvent: null,
          error: null,
        });
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
        const { icsUrl, eventsLastFetched, loading } = get();

        if (!icsUrl || loading) return;

        const cacheDuration = get().getSmartCacheDuration();
        if (
          !force &&
          eventsLastFetched &&
          Date.now() - eventsLastFetched < cacheDuration
        ) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const events = await fetchICSCalendar(icsUrl);
          const now = new Date();

          const activeEvents = events
            .filter((event) => {
              try {
                const eventEnd = getEventEndDate(event);
                return eventEnd > now;
              } catch {
                return false;
              }
            })
            .sort((a, b) => {
              try {
                const aStart = getEventStartDate(a);
                const bStart = getEventStartDate(b);
                return aStart.getTime() - bStart.getTime();
              } catch {
                return 0;
              }
            });

          set({
            events: activeEvents,
            eventsLastFetched: Date.now(),
            nextEvent: activeEvents[0] || null,
            loading: false,
          });
        } catch (error) {
          console.error("Failed to load calendar events:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to load events",
            loading: false,
          });
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
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        icsUrl: state.icsUrl,
        events: state.events,
        eventsLastFetched: state.eventsLastFetched,
        nextEvent: state.nextEvent,
      }),
    }
  )
);
