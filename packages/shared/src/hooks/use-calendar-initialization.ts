import { useEffect } from "react";
import { fetchCalendarEvents } from "../api/google-calendar.api";
import { getCalendarToken } from "../api/calendar.api";
import { useCalendarStore } from "../stores";
import { useDockStore } from "../stores/dock.store";

/**
 * Hook to initialize calendar tokens and handle OAuth callbacks
 */
export const useCalendarInitialization = () => {
  const { token, setToken, loadEvents } = useCalendarStore();
  const { setCalendarVisible } = useDockStore();

  const initializeToken = async () => {
    try {
      const response = await getCalendarToken();

      if (response.data.accessToken) {
        const expiresAt = response.data.expiresAt
          ? new Date(response.data.expiresAt).getTime()
          : Date.now() + 3600000;

        setToken(response.data.accessToken, expiresAt);
      }
    } catch (error) {
      console.error("Failed to initialize calendar token:", error);
    }
  };

  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("calendar");

    if (!status) return;

    window.history.replaceState({}, "", window.location.pathname);

    if (status === "connected") {
      setCalendarVisible(false);
      initializeToken();
    } else if (status === "error") {
      console.error("Calendar connection failed:", urlParams.get("error"));
    }
  };

  useEffect(() => {
    handleOAuthCallback();
    if (!token) {
      initializeToken();
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadEvents(fetchCalendarEvents);
    }
  }, [token, loadEvents]);
};
