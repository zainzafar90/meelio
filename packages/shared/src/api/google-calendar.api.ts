export interface CalendarEventTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface ConferenceEntryPoint {
  entryPointType: string;
  uri: string;
  label: string;
}

export interface ConferenceSolution {
  key: {
    type: string;
  };
  name: string;
  iconUri: string;
}

export interface ConferenceData {
  entryPoints: ConferenceEntryPoint[];
  conferenceSolution: ConferenceSolution;
  conferenceId: string;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
  colorId?: string;
  hangoutLink?: string;
  conferenceData?: ConferenceData;
  htmlLink?: string;
  status?: string;
  created?: string;
  updated?: string;
}

export interface CalendarEventsResponse {
  kind: string;
  etag: string;
  summary: string;
  description: string;
  timeZone: string;
  items: CalendarEvent[];
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
): Promise<CalendarEventsResponse> => {
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
    throw new CalendarEventError(
      `Failed to fetch events: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as CalendarEventsResponse;
  return data;
};
