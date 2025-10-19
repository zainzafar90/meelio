import { CalendarEvent } from "../api/google-calendar.api";

export const getEventStartDate = (event: CalendarEvent): Date => {
  const dateString = event.start.dateTime || event.start.date;
  if (!dateString) {
    throw new Error("Event has no valid start date");
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid start date format: ${dateString}`);
  }

  return date;
};

export const getEventEndDate = (event: CalendarEvent): Date => {
  const dateString = event.end.dateTime || event.end.date;
  if (!dateString) {
    throw new Error("Event has no valid end date");
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid end date format: ${dateString}`);
  }

  if (event.end.date && !event.end.dateTime) {
    date.setMilliseconds(date.getMilliseconds() - 1);
  }

  return date;
};

export const isEventHappening = (event: CalendarEvent, now: Date = new Date()): boolean => {
  try {
    const start = getEventStartDate(event);
    const end = getEventEndDate(event);
    return now >= start && now < end;
  } catch {
    return false;
  }
};

export const isAllDayEvent = (event: CalendarEvent): boolean => {
  return !event.start.dateTime && !event.end.dateTime &&
    !!event.start.date && !!event.end.date;
};

export const getMinutesUntilEvent = (event: CalendarEvent, now: Date = new Date()): number => {
  try {
    const start = getEventStartDate(event);
    const end = getEventEndDate(event);

    if (now >= start && now < end) {
      const diffMs = end.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60)));
    }

    const diffMs = start.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  } catch {
    return 0;
  }
};

export const isEventToday = (event: CalendarEvent, now: Date = new Date()): boolean => {
  try {
    const start = getEventStartDate(event);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return start >= today && start < tomorrow;
  } catch {
    return false;
  }
};