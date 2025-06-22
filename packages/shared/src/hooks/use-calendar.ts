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
        // Force token initialization with retry logic after OAuth success
        const retryTokenInit = async () => {
          await initializeToken();
          // If no token after first try, retry once more after a delay
          setTimeout(async () => {
            const currentToken = useCalendarStore.getState().token;
            if (!currentToken) {
              await initializeToken();
            }
          }, 500);
        };
        retryTokenInit();
      }
    }

    // Initialize token if user is authenticated and no token exists
    // (We always check for tokens regardless of visibility setting)
    if (user && !token) {
      initializeToken();
    }
  }, [user, token, initializeToken, setCalendarVisible]);

  // Remove refresh interval - backend handles token refresh automatically

  useEffect(() => {
    // Load events when token is available (regardless of visibility)
    // This keeps data fresh for quick show/hide
    if (token) {
      loadEvents(true); // Force refresh after OAuth
    }
  }, [token, loadEvents]);
};
