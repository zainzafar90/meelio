import { ReactNode, useEffect } from "react";

import { fetchCalendarEvents } from "../api/google-calendar.api";
import { getCalendarTokenStatus } from "../api/calendar.api";
import { useCalendarTokenStore } from "../stores/calendar-token.store";
import { useDockStore } from "../stores/dock.store";
import { useShallow } from "zustand/shallow";

/**
 * Load calendar events when a token exists
 */
export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const { token, setToken, loadEvents } = useCalendarTokenStore(
    useShallow((state) => ({
      token: state.token,
      setToken: state.setToken,
      loadEvents: state.loadEvents,
    }))
  );
  
  const { setCalendarVisible } = useDockStore(
    useShallow((state) => ({
      setCalendarVisible: state.setCalendarVisible,
    }))
  );

  // Load events when token exists
  useEffect(() => {
    if (token) {
      loadEvents(fetchCalendarEvents).catch((error) => {
        console.error('Failed to load calendar events:', error);
      });
    }
  }, [token, loadEvents]);

  // Check for existing tokens on mount
  useEffect(() => {
    if (!token) {
      getCalendarTokenStatus()
        .then((response) => {
          if (response.data.hasToken && response.data.accessToken) {
            const expiresAt = response.data.expiresAt 
              ? new Date(response.data.expiresAt).getTime()
              : Date.now() + 3600000;
            setToken(response.data.accessToken, expiresAt);
          }
        })
        .catch((error) => {
          console.error('Failed to check existing calendar token:', error);
        });
    }
  }, [token, setToken]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarStatus = urlParams.get('calendar');
    
    if (calendarStatus === 'connected') {
      // Calendar was successfully connected
      setCalendarVisible(false);
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Check token status and update store
      getCalendarTokenStatus()
        .then((response) => {
          if (response.data.hasToken && response.data.accessToken) {
            const expiresAt = response.data.expiresAt 
              ? new Date(response.data.expiresAt).getTime()
              : Date.now() + 3600000;
            setToken(response.data.accessToken, expiresAt);
          }
        })
        .catch((error) => {
          console.error('Failed to check calendar token status:', error);
        });
    } else if (calendarStatus === 'error') {
      // Calendar connection failed
      const error = urlParams.get('error');
      console.error('Calendar connection failed:', error);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setCalendarVisible, setToken]);

  return <>{children}</>;
};
