export interface CalendarEventTime {
  dateTime?: string;
  date?: string;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
}

export class CalendarEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarEventError";
  }
}

/**
 * Fetch events from Google Calendar
 */
export const fetchCalendarEvents = async (
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<CalendarEvent[]> => {
  const res = await fetchFn(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new CalendarEventError("Failed to fetch events");
  const data = (await res.json()) as { items: CalendarEvent[] };
  return data.items;
};
