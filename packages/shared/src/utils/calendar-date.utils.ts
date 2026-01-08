import type { CalendarEvent } from "../types/calendar.types";

export function getEventStartDate(event: CalendarEvent): Date {
  if (event.start.dateTime) {
    return new Date(event.start.dateTime);
  }
  if (event.start.date) {
    return new Date(event.start.date + "T00:00:00");
  }
  throw new Error("Event has no start date");
}

export function getEventEndDate(event: CalendarEvent): Date {
  if (event.end.dateTime) {
    return new Date(event.end.dateTime);
  }
  if (event.end.date) {
    const endDate = new Date(event.end.date + "T00:00:00");
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }
  throw new Error("Event has no end date");
}

export function isAllDayEvent(event: CalendarEvent): boolean {
  return !event.start.dateTime && !!event.start.date;
}

export function isEventHappening(event: CalendarEvent, now: Date): boolean {
  const start = getEventStartDate(event);
  const end = getEventEndDate(event);
  return now >= start && now <= end;
}

export function isEventToday(event: CalendarEvent, now: Date): boolean {
  const eventStart = getEventStartDate(event);
  return (
    eventStart.getDate() === now.getDate() &&
    eventStart.getMonth() === now.getMonth() &&
    eventStart.getFullYear() === now.getFullYear()
  );
}

export function getMinutesUntilEvent(event: CalendarEvent): number | null {
  const start = getEventStartDate(event);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  if (diffMs < 0) return null;
  return Math.floor(diffMs / (1000 * 60));
}
