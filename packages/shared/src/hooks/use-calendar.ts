import { useEffect } from "react";
import { REFRESH_THRESHOLD_MS, useCalendarStore } from "../stores";
import { useDockStore } from "../stores/dock.store";

export const useCalendar = (): void => {
  const { token, initializeToken, refreshToken, loadEvents } =
    useCalendarStore();
  const { setCalendarVisible } = useDockStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("calendar");

    if (status) {
      window.history.replaceState({}, "", window.location.pathname);
      if (status === "connected") {
        setCalendarVisible(false);
      }
    }

    if (!token) {
      initializeToken();
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    refreshToken();
    const intervalId = setInterval(() => refreshToken(), REFRESH_THRESHOLD_MS); // Check every minute

    return () => clearInterval(intervalId);
  }, [token, refreshToken]);

  useEffect(() => {
    if (token) {
      loadEvents();
    }
  }, [token, loadEvents]);
};
