export interface CalendarEventTime {
  dateTime?: string;
  date?: string;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
  colorId?: string;
}

export class CalendarEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarEventError";
  }
}

export class CalendarAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarAuthError";
  }
}

/**
 * Fetch events from Google Calendar
 */
export const fetchCalendarEvents = async (
  token: string,
  fetchFn: typeof fetch = fetch
): Promise<CalendarEvent[]> => {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ahead

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });

  const res = await fetchFn(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error(
      `Calendar API error: ${res.status} ${res.statusText}`,
      errorText
    );
    throw new CalendarEventError(
      `Failed to fetch events: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as { items: CalendarEvent[] };
  return data.items || [];
};
