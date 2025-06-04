import { axios } from "./axios";

export interface CalendarEvent {
  summary: string;
  start: string;
}

export const calendarApi = {
  async getAuthUrl(): Promise<{ url: string }> {
    const { data } = await axios.get("/v1/calendar/authorize");
    return data;
  },

  async getNextEvent(): Promise<CalendarEvent | null> {
    const { data } = await axios.get("/v1/calendar/events");
    return data;
  },

  async revokeAccess(): Promise<void> {
    await axios.delete("/v1/calendar");
  },
};
