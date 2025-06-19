export const CALENDAR_COLORS = {
  "1": "#7986CB", // Lavender
  "2": "#33B679", // Sage
  "3": "#8E24AA", // Grape
  "4": "#E67C73", // Flamingo
  "5": "#F6BF26", // Banana
  "6": "#F4511E", // Tangerine
  "7": "#039BE5", // Peacock
  "8": "#616161", // Graphite
  "9": "#3F51B5", // Blueberry
  "10": "#0B8043", // Basil
  "11": "#D50000", // Tomato
} as const;

export const CALENDAR_COLORS_CLASSIC = {
  "1": "#A4BDFC", // Lavender
  "2": "#7AE7BF", // Sage
  "3": "#DBADFF", // Grape
  "4": "#FF887C", // Flamingo
  "5": "#FBD75B", // Banana
  "6": "#FFB878", // Tangerine
  "7": "#46D6DB", // Peacock
  "8": "#E1E1E1", // Graphite
  "9": "#5484ED", // Blueberry
  "10": "#51B749", // Basil
  "11": "#DC2127", // Tomato
} as const;

/**
 * Get the event color hex value from Google Calendar colorId
 * @param colorId - The Google Calendar color ID (1-11)
 * @param useClassic - Whether to use classic colors instead of modern
 */
export const getCalendarColor = (
  colorId?: string,
  useClassic = true
): string => {
  const colors = useClassic ? CALENDAR_COLORS_CLASSIC : CALENDAR_COLORS;

  if (colorId && colorId in colors) {
    return colors[colorId as keyof typeof colors];
  }

  // Default to blueberry color
  return useClassic ? CALENDAR_COLORS_CLASSIC["9"] : CALENDAR_COLORS["9"];
};
