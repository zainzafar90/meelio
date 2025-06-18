import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { CalendarEvent } from "../api/google-calendar.api";

export interface CalendarTokenState {
  token: string | null;
  expiresAt: number | null;
  events: CalendarEvent[];
  setToken: (token: string, expiresAt: number) => void;
  clearToken: () => void;
  refreshToken: (
    fetchNewToken: () => Promise<{ token: string; expiresIn: number }>,
  ) => Promise<void>;
  loadEvents: (
    fetchEvents: (token: string) => Promise<CalendarEvent[]>,
  ) => Promise<void>;
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
      setToken: (token, expiresAt) => {
        set({ token, expiresAt });
      },
      clearToken: () => {
        set({ token: null, expiresAt: null, events: [] });
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
        const events = await fetchEvents(token);
        set({ events });
      },
    }),
    {
      name: "meelio:local:calendar-token",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
