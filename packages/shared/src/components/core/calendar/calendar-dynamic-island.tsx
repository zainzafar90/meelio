import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { useCalendarStore } from "../../../stores/calendar.store";
import { useDockStore } from "../../../stores/dock.store";
import { useAuthStore } from "../../../stores/auth.store";
import { getCalendarColor } from "../../../utils/calendar-colors";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../lib/utils";

export const CalendarDynamicIsland = () => {
  const { getMinutesUntilNextEvent, nextEvent, token } = useCalendarStore(
    useShallow((state) => ({
      getMinutesUntilNextEvent: state.getMinutesUntilNextEvent,
      nextEvent: state.nextEvent,
      token: state.token,
    }))
  );

  const { setCalendarVisible } = useDockStore(
    useShallow((state) => ({
      setCalendarVisible: state.setCalendarVisible,
    }))
  );

  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  const calendarEnabled = user?.settings?.calendar?.enabled ?? false;

  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    const updateMinutes = () => {
      const minutes = getMinutesUntilNextEvent();
      setMinutesLeft(minutes);
    };

    updateMinutes();
    const interval = setInterval(updateMinutes, 60000);

    return () => clearInterval(interval);
  }, [getMinutesUntilNextEvent, nextEvent]);

  const shouldShow =
    !!token && calendarEnabled && nextEvent && minutesLeft !== null;

  if (!shouldShow) {
    return null;
  }

  const formatTime = (minutes: number): string => {
    if (minutes <= 0) {
      return "Now";
    }

    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d`;
    }

    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
      return `${weeks}w`;
    }

    const months = Math.floor(weeks / 4);
    if (months < 12) {
      return `${months}mo`;
    }

    const years = Math.floor(months / 12);
    return `${years}y`;
  };

  const getEventStatus = () => {
    if (!nextEvent || minutesLeft === null)
      return { isHappening: false, timeText: "" };

    const now = Date.now();
    const eventStart = new Date(
      nextEvent.start.dateTime || nextEvent.start.date || ""
    );
    const eventEnd = new Date(
      nextEvent.end.dateTime || nextEvent.end.date || ""
    );

    const isHappening = now >= eventStart.getTime() && now < eventEnd.getTime();
    const timeText = formatTime(minutesLeft);

    return { isHappening, timeText };
  };

  const { isHappening, timeText } = getEventStatus();

  const eventColor = getCalendarColor(nextEvent.colorId);

  const handleClick = () => {
    setCalendarVisible(true);
  };

  const tooltipText = isHappening
    ? `Current event: ${nextEvent.summary} ending in ${timeText}`
    : `Next event: ${nextEvent.summary} in ${timeText}`;

  return (
    <div
      className="fixed top-0 inset-x-0 flex items-center w-full max-w-48 mx-auto px-3 bg-black/75 backdrop-blur-sm rounded-2xl text-white text-sm font-medium -translate-y-1/2 pt-4 pb-1 transition-all cursor-pointer hover:bg-black/90"
      title={tooltipText}
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${nextEvent.summary}-${eventColor}-${nextEvent.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-between w-full mt-4 min-w-0"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
            <div
              className={cn(
                "size-2.5 rounded-full flex-shrink-0",
                (minutesLeft < 10 || isHappening) && "animate-pulse"
              )}
              style={{ backgroundColor: eventColor }}
              aria-hidden="true"
            />
            <span className="truncate text-xs flex-1 min-w-0">
              {nextEvent.summary || "Event"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs opacity-80 flex-shrink-0">
            {timeText}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
