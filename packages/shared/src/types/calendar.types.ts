export interface CalendarEventTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
  colorId?: string;
  htmlLink?: string;
  status?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
}
