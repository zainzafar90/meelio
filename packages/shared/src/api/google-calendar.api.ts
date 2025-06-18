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

/**
 * Request calendar token from Google OAuth
 */
export const requestCalendarToken = (
  clientId: string,
  google: typeof window.google = window.google,
): Promise<{ token: string; expiresIn: number }> => {
  return new Promise((resolve, reject) => {
    const oauth = google?.accounts?.oauth2;
    if (!oauth) {
      reject(new CalendarAuthError("OAuth unavailable"));
      return;
    }
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: (res) => {
        if (!res.access_token) {
          reject(new CalendarAuthError(res.error || "No token"));
          return;
        }
        resolve({ token: res.access_token, expiresIn: res.expires_in ?? 3600 });
      },
    });
    client.requestAccessToken();
  });
};
