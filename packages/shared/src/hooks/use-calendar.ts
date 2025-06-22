import { useEffect, useMemo } from "react";
import { useCalendarStore } from "../stores";
import { useDockStore } from "../stores/dock.store";
import { useAuthStore } from "../stores/auth.store";

export const useCalendar = (): void => {
  const { token, initializeToken, loadEvents } = useCalendarStore();
  const { setCalendarVisible } = useDockStore();
  const { user } = useAuthStore();

  const calendarEnabled = useMemo(
    () => user?.settings?.calendar?.enabled ?? false,
    [user]
  );

  useEffect(() => {
    const handleOAuthCallback = () => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("calendar");

      if (!status) return;

      // Clean up URL once we've parsed the status
      window.history.replaceState({}, "", window.location.pathname);

      if (status === "connected") {
        // Close the calendar connection modal and re-initialize the token
        setCalendarVisible(false);
        initializeToken();
      }
    };

    handleOAuthCallback();

    // Initialize token if user is authenticated, has calendar enabled, and no token exists
    if (user && calendarEnabled && !token) {
      initializeToken();
    }
  }, [user, token, calendarEnabled, initializeToken, setCalendarVisible]);

  // Remove refresh interval - backend handles token refresh automatically

  useEffect(() => {
    if (!token || !calendarEnabled) return;
    loadEvents(true); // Force refresh after OAuth connection
  }, [token, calendarEnabled, loadEvents]);
};
