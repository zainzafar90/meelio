import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { useCalendarStore } from "../../../stores/calendar.store";
import { useDockStore } from "../../../stores/dock.store";
import { useAuthStore } from "../../../stores/auth.store";
import { getCalendarColor } from "../../../utils/calendar-colors";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../lib/utils";

export const CalendarDynamicIsland = () => {
  const { getMinutesUntilNextEvent, nextEvent, token, events } = useCalendarStore(
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
  const [displayEvent, setDisplayEvent] = useState<any>(null);

  useEffect(() => {
    const updateMinutes = () => {
      const minutes = getMinutesUntilNextEvent();
      setMinutesLeft(minutes);
    };

    updateMinutes();
    const interval = setInterval(updateMinutes, 60000);

    return () => clearInterval(interval);
  }, [getMinutesUntilNextEvent, nextEvent]);

  // Check if we should keep showing a recently started event (within 10 minutes)
  useEffect(() => {
    const now = Date.now();
    
    // Find any event that started within the last 10 minutes
    const recentlyStartedEvent = events.find((event) => {
      const eventStart = new Date(event.start.dateTime || event.start.date || "");
      const eventEnd = new Date(event.end.dateTime || event.end.date || "");
      const timeSinceStart = now - eventStart.getTime();
      
      // Event started within last 10 minutes and hasn't ended
      return timeSinceStart >= 0 && timeSinceStart <= 10 * 60 * 1000 && now < eventEnd.getTime();
    });

    // Priority: nextEvent (upcoming/ongoing) > recentlyStartedEvent > null
    setDisplayEvent(nextEvent || recentlyStartedEvent || null);
  }, [nextEvent, events]);

  // Always show indicator when calendar is enabled and connected
  const shouldShow = !!token && calendarEnabled;

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
    if (!displayEvent) {
      return { isHappening: false, timeText: "", hasEvent: false };
    }

    const now = Date.now();
    const eventStart = new Date(
      displayEvent.start.dateTime || displayEvent.start.date || ""
    );
    const eventEnd = new Date(
      displayEvent.end.dateTime || displayEvent.end.date || ""
    );

    const isHappening = now >= eventStart.getTime() && now < eventEnd.getTime();
    const timeText = minutesLeft !== null ? formatTime(minutesLeft) : "";

    return { isHappening, timeText, hasEvent: true };
  };

  const { isHappening, timeText, hasEvent } = getEventStatus();

  const eventColor = hasEvent ? getCalendarColor(displayEvent.colorId) : "#6b7280";

  const handleClick = () => {
    setCalendarVisible(true);
  };

  const tooltipText = hasEvent
    ? isHappening
      ? `Current event: ${displayEvent.summary} ending in ${timeText}`
      : `Next event: ${displayEvent.summary} starts in ${timeText}`
    : "No upcoming events";

  return (
    <div
      className="fixed top-0 inset-x-0 flex items-center w-full max-w-48 mx-auto px-3 bg-black/75 backdrop-blur-sm rounded-2xl text-white text-sm font-medium -translate-y-1/2 pt-4 pb-1 transition-all cursor-pointer hover:bg-black/90"
      title={tooltipText}
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={hasEvent ? `${displayEvent.summary}-${eventColor}-${displayEvent.id}` : "no-events"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex justify-between w-full mt-4"
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-2.5 rounded-full",
                hasEvent && (minutesLeft < 10 || isHappening) && "animate-pulse"
              )}
              style={{ backgroundColor: eventColor }}
              aria-hidden="true"
            />
            <span className="truncate max-w-32 text-xs">
              {hasEvent ? displayEvent.summary || "Event" : "No Events"}
            </span>
          </div>
          {hasEvent && (
            <div className="flex items-center gap-1 ml-auto pl-3 text-xs opacity-80">
              {timeText}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
