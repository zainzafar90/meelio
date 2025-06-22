import { useEffect } from "react";
import { useCalendarStore } from "../stores";
import { useDockStore } from "../stores/dock.store";
import { useAuthStore } from "../stores/auth.store";

export const useCalendar = (): void => {
  const { token, initializeToken, loadEvents } = useCalendarStore();
  const { setCalendarVisible } = useDockStore();
  const { user } = useAuthStore();

  const calendarEnabled = user?.settings?.calendar?.enabled ?? false;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("calendar");

    // Handle OAuth callback
    if (status) {
      window.history.replaceState({}, "", window.location.pathname);
      if (status === "connected") {
        setCalendarVisible(false);
        // Force token initialization after OAuth success (always needed for connection flow)
        initializeToken();
      }
    }

    // Only initialize token if user is authenticated, no token exists, AND calendar is enabled
    if (user && !token && calendarEnabled) {
      initializeToken();
    }
  }, [user, token, calendarEnabled, initializeToken, setCalendarVisible]);

  // Remove refresh interval - backend handles token refresh automatically

  useEffect(() => {
    // Only load events when token is available AND calendar features are enabled
    if (token && calendarEnabled) {
      loadEvents(true); // Force refresh after OAuth
    }
  }, [token, calendarEnabled, loadEvents]);
};
