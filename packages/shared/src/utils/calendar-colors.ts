const CALENDAR_COLORS: Record<string, string> = {
  "1": "#7986CB",
  "2": "#33B679",
  "3": "#8E24AA",
  "4": "#E67C73",
  "5": "#F6BF26",
  "6": "#F4511E",
  "7": "#039BE5",
  "8": "#616161",
  "9": "#3F51B5",
  "10": "#0B8043",
  "11": "#D50000",
};

const DEFAULT_COLOR = "#4285F4";

export function getCalendarColor(colorId?: string): string {
  if (!colorId) return DEFAULT_COLOR;
  return CALENDAR_COLORS[colorId] || DEFAULT_COLOR;
}
