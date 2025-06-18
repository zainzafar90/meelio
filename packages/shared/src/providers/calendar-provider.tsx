import { ReactNode, useEffect } from "react";

import { fetchCalendarEvents } from "../api/google-calendar.api";
import { useCalendarTokenStore } from "../stores/calendar-token.store";

/**
 * Load calendar events when a token exists
 */
export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const { token, loadEvents } = useCalendarTokenStore((state) => ({
    token: state.token,
    loadEvents: state.loadEvents,
  }));

  useEffect(() => {
    if (token) {
      loadEvents(fetchCalendarEvents);
    }
  }, [token, loadEvents]);

  return <>{children}</>;
};
