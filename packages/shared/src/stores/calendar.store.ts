import { create } from "zustand";
import { calendarApi, CalendarEvent } from "../api/calendar.api";

interface CalendarState {
  nextEvent: CalendarEvent | null;
  permission: boolean;
  fetchEvents: () => Promise<void>;
  revokeAccess: () => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  nextEvent: null,
  permission: false,
  fetchEvents: async () => {
    try {
      const event = await calendarApi.getNextEvent();
      set({ nextEvent: event, permission: true });
    } catch {
      set({ nextEvent: null, permission: false });
    }
  },
  revokeAccess: async () => {
    await calendarApi.revokeAccess();
    set({ nextEvent: null, permission: false });
  },
}));
