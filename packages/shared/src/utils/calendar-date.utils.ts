import { CalendarEvent } from "../api/google-calendar.api";

/**
 * Safely parse event start date, handling both dateTime and date fields
 */
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

/**
 * Safely parse event end date, handling both dateTime and date fields
 */
export const getEventEndDate = (event: CalendarEvent): Date => {
  const dateString = event.end.dateTime || event.end.date;
  if (!dateString) {
    throw new Error("Event has no valid end date");
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid end date format: ${dateString}`);
  }
  
  // For all-day events, the end date is exclusive (next day at 00:00)
  // We need to subtract 1 millisecond to get the actual end of the event
  if (event.end.date && !event.end.dateTime) {
    date.setMilliseconds(date.getMilliseconds() - 1);
  }
  
  return date;
};

/**
 * Check if an event is currently happening
 */
export const isEventHappening = (event: CalendarEvent, now: Date = new Date()): boolean => {
  try {
    const start = getEventStartDate(event);
    const end = getEventEndDate(event);
    return now >= start && now < end;
  } catch {
    return false;
  }
};

/**
 * Check if an event is an all-day event
 */
export const isAllDayEvent = (event: CalendarEvent): boolean => {
  return !event.start.dateTime && !event.end.dateTime && 
         !!event.start.date && !!event.end.date;
};

/**
 * Get minutes until event start or end (depending on if it's happening)
 */
export const getMinutesUntilEvent = (event: CalendarEvent, now: Date = new Date()): number => {
  try {
    const start = getEventStartDate(event);
    const end = getEventEndDate(event);
    
    if (now >= start && now < end) {
      // Event is happening, return minutes until end
      const diffMs = end.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60)));
    }
    
    // Event hasn't started, return minutes until start
    const diffMs = start.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  } catch {
    return 0;
  }
};