import ICAL from "ical.js";
import type { CalendarEvent } from "../types/calendar.types";

export async function fetchICSCalendar(
  icsUrl: string,
): Promise<CalendarEvent[]> {
  const normalizedUrl = normalizeICSUrl(icsUrl);

  const urlWithCacheBust = new URL(normalizedUrl);
  urlWithCacheBust.searchParams.set("_cb", Date.now().toString());

  const response = await fetch(urlWithCacheBust.toString(), {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch calendar: ${response.status}`);
  }

  const icsData = await response.text();
  return parseICSData(icsData);
}

export function parseICSData(icsData: string): CalendarEvent[] {
  const jcalData = ICAL.parse(icsData);
  const vcalendar = new ICAL.Component(jcalData);
  const vevents = vcalendar.getAllSubcomponents("vevent");

  const events: CalendarEvent[] = [];
  const now = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);

    if (event.isRecurring()) {
      const iterator = event.iterator();
      let next = iterator.next();
      let count = 0;
      const maxOccurrences = 50;

      while (next && count < maxOccurrences) {
        const occurrenceStart = next.toJSDate();

        if (occurrenceStart > threeMonthsFromNow) break;

        if (occurrenceStart >= now || isEventOngoing(event, occurrenceStart)) {
          const duration = event.duration;
          const occurrenceEnd = new Date(
            occurrenceStart.getTime() + duration.toSeconds() * 1000,
          );

          events.push(
            createCalendarEvent(event, occurrenceStart, occurrenceEnd, count),
          );
          count++;
        }

        next = iterator.next();
      }
    } else {
      const startDate = event.startDate?.toJSDate();
      const endDate = event.endDate?.toJSDate();

      if (startDate && endDate && (startDate >= now || endDate >= now)) {
        events.push(createCalendarEvent(event, startDate, endDate));
      }
    }
  }

  return events.sort((a, b) => {
    const aStart = new Date(a.start.dateTime || a.start.date || 0);
    const bStart = new Date(b.start.dateTime || b.start.date || 0);
    return aStart.getTime() - bStart.getTime();
  });
}

function isEventOngoing(event: ICAL.Event, occurrenceStart: Date): boolean {
  const duration = event.duration;
  const occurrenceEnd = new Date(
    occurrenceStart.getTime() + duration.toSeconds() * 1000,
  );
  return occurrenceEnd >= new Date();
}

function extractMeetingLink(
  description?: string,
  location?: string,
): string | undefined {
  const textToSearch = `${description || ""} ${location || ""}`;

  const meetingPatterns = [
    /https:\/\/meet\.google\.com\/[a-z-]+/gi,
    /https:\/\/zoom\.us\/j\/\d+/gi,
    /https:\/\/[a-z0-9-]+\.zoom\.us\/j\/\d+/gi,
    /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s<>"]+/gi,
    /https:\/\/[a-z0-9-]+\.webex\.com\/[^\s<>"]+/gi,
  ];

  for (const pattern of meetingPatterns) {
    const match = textToSearch.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

function createCalendarEvent(
  event: ICAL.Event,
  startDate: Date,
  endDate: Date,
  occurrenceIndex?: number,
): CalendarEvent {
  const isAllDay = event.startDate?.isDate ?? false;
  const id =
    occurrenceIndex !== undefined
      ? `${event.uid}-${occurrenceIndex}`
      : event.uid;

  const description = event.description || undefined;
  const location = event.location || undefined;
  const meetingLink = extractMeetingLink(description, location);

  return {
    id,
    summary: event.summary || undefined,
    description,
    location,
    start: isAllDay
      ? { date: startDate.toISOString().split("T")[0] }
      : { dateTime: startDate.toISOString() },
    end: isAllDay
      ? { date: endDate.toISOString().split("T")[0] }
      : { dateTime: endDate.toISOString() },
    status:
      (event.component.getFirstPropertyValue("status") as string) || undefined,
    hangoutLink: meetingLink,
  };
}

export function validateICSUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" ||
      parsed.protocol === "http:" ||
      parsed.protocol === "webcal:"
    );
  } catch {
    return false;
  }
}

export function normalizeICSUrl(url: string): string {
  if (url.startsWith("webcal://")) {
    return url.replace("webcal://", "https://");
  }
  return url;
}
