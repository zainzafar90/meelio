import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { useCalendarStore } from "../../../stores/calendar.store";
import { useDockStore } from "../../../stores/dock.store";
import { useAuthStore } from "../../../stores/auth.store";
import { getCalendarColor } from "../../../utils/calendar-colors";
import {
  isEventHappening,
  isAllDayEvent,
  isEventToday,
} from "../../../utils/calendar-date.utils";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../lib/utils";
import type { CalendarEvent } from "../../../api/google-calendar.api";

export const CalendarDynamicIsland = () => {
  const { getMinutesUntilNextEvent, nextEvent, token, events } =
    useCalendarStore(
      useShallow((state) => ({
        getMinutesUntilNextEvent: state.getMinutesUntilNextEvent,
        nextEvent: state.nextEvent,
        token: state.token,
        events: state.events,
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
  const [displayEvent, setDisplayEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const updateMinutes = () => {
      const minutes = getMinutesUntilNextEvent();
      setMinutesLeft(minutes);
    };

    updateMinutes();
    const interval = setInterval(updateMinutes, 60000);

    return () => clearInterval(interval);
  }, [getMinutesUntilNextEvent, nextEvent]);

  const RECENTLY_STARTED_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

  // Check if we should keep showing a recently started event
  useEffect(() => {
    const now = Date.now();

    const recentlyStartedEvent = events.find((event) => {
      const eventStart = new Date(
        event.start.dateTime || event.start.date || ""
      );
      const eventEnd = new Date(event.end.dateTime || event.end.date || "");
      const timeSinceStart = now - eventStart.getTime();

      // Event started within threshold and hasn't ended
      return (
        timeSinceStart >= 0 &&
        timeSinceStart <= RECENTLY_STARTED_THRESHOLD_MS &&
        now < eventEnd.getTime()
      );
    });

    // Priority: nextEvent (upcoming/ongoing) > recentlyStartedEvent > null
    setDisplayEvent(nextEvent || recentlyStartedEvent || null);
  }, [nextEvent, events, RECENTLY_STARTED_THRESHOLD_MS]);

  if (!token || !calendarEnabled) {
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

  // Show "No Events" if no event or event is more than 24 hours away
  if (!displayEvent || minutesLeft === null || minutesLeft > 24 * 60) {
    const handleClick = () => {
      setCalendarVisible(true);
    };

    return (
      <div
        className="fixed top-0 inset-x-0 flex items-center w-full max-w-48 mx-auto px-3 bg-black/75 backdrop-blur-sm rounded-2xl text-white text-sm font-medium -translate-y-1/2 pt-4 pb-1 transition-all cursor-pointer hover:bg-black/90"
        title="No upcoming events"
        onClick={handleClick}
      >
        <div className="flex justify-center w-full mt-4">
          <span className="truncate max-w-32 text-xs text-zinc-400">
            No Events
          </span>
        </div>
      </div>
    );
  }

  const isHappening = isEventHappening(displayEvent);
  const isAllDay = isAllDayEvent(displayEvent);
  const timeText = isHappening
    ? "Now"
    : isAllDay
      ? "Today"
      : formatTime(minutesLeft);

  const eventIsToday = displayEvent ? isEventToday(displayEvent) : false;
  const eventColor =
    displayEvent && eventIsToday
      ? getCalendarColor(displayEvent.colorId)
      : "#6b7280";

  const handleClick = () => {
    setCalendarVisible(true);
  };

  const tooltipText = displayEvent
    ? isHappening
      ? `Current event: ${displayEvent.summary || "Event"}${isAllDay ? " (all day)" : ` ending in ${timeText}`}`
      : `Next event: ${displayEvent.summary || "Event"}${isAllDay ? " (all day)" : ` starts in ${timeText}`}`
    : "No upcoming events";

  return (
    <div
      className="fixed top-0 inset-x-0 flex items-center w-full max-w-48 mx-auto px-3 bg-black/75 backdrop-blur-sm rounded-2xl text-white text-sm font-medium -translate-y-1/2 pt-4 pb-1 transition-all cursor-pointer hover:bg-black/90"
      title={tooltipText}
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={
            displayEvent
              ? `${displayEvent.summary}-${eventColor}-${displayEvent.id}`
              : "no-events"
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-between w-full mt-4 min-w-0"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
            <div
              className={cn(
                "size-2.5 rounded-full flex-shrink-0",
                displayEvent &&
                  ((minutesLeft !== null && minutesLeft < 10) || isHappening) &&
                  "animate-pulse"
              )}
              style={{ backgroundColor: eventColor }}
              aria-hidden="true"
            />
            <span className="truncate text-xs flex-1 min-w-0">
              {displayEvent?.summary || "Event"}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-auto pl-0 text-xs opacity-80 flex-shrink-0">
            {timeText}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
