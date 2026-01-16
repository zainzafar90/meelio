import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { useBookmarksStore } from "../../../stores/bookmarks.store";
import { useCalendarStore } from "../../../stores/calendar.store";
import { useDockStore } from "../../../stores/dock.store";
import { getCalendarColor } from "../../../utils/calendar-colors";
import {
  isEventHappening,
  isAllDayEvent,
  isEventToday,
} from "../../../utils/calendar-date.utils";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../lib/utils";
import type { CalendarEvent } from "../../../types/calendar.types";

const IS_EXTENSION = typeof chrome !== "undefined" && !!chrome.storage;

export const CalendarDynamicIsland = () => {
  const { getMinutesUntilNextEvent, nextEvent, icsUrl, events } =
    useCalendarStore(
      useShallow((state) => ({
        getMinutesUntilNextEvent: state.getMinutesUntilNextEvent,
        nextEvent: state.nextEvent,
        icsUrl: state.icsUrl,
        events: state.events,
      }))
    );

  const { setCalendarVisible, dockIconsVisible } = useDockStore(
    useShallow((state) => ({
      setCalendarVisible: state.setCalendarVisible,
      dockIconsVisible: state.dockIconsVisible,
    }))
  );

  const { hasPermissions, displayMode, bookmarks } = useBookmarksStore(
    useShallow((state) => ({
      hasPermissions: state.hasPermissions,
      displayMode: state.displayMode,
      bookmarks: state.bookmarks,
    }))
  );

  const calendarEnabled = dockIconsVisible.calendar ?? true;

  const showBookmarksBar = IS_EXTENSION && hasPermissions && (displayMode === 'bar' || displayMode === 'both');
  const bookmarksBar = bookmarks.find(
    (node) => node.title === "Bookmarks Bar" || node.title === "Bookmarks bar"
  );
  const hasBookmarksContent = bookmarksBar?.children && bookmarksBar.children.length > 0;
  const hasBookmarksBarVisible = showBookmarksBar && hasBookmarksContent;

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

  const RECENTLY_STARTED_THRESHOLD_MS = 10 * 60 * 1000;

  useEffect(() => {
    const now = Date.now();

    const recentlyStartedEvent = events.find((event) => {
      const eventStart = new Date(
        event.start.dateTime || event.start.date || ""
      );
      const eventEnd = new Date(event.end.dateTime || event.end.date || "");
      const timeSinceStart = now - eventStart.getTime();

      return (
        timeSinceStart >= 0 &&
        timeSinceStart <= RECENTLY_STARTED_THRESHOLD_MS &&
        now < eventEnd.getTime()
      );
    });

    setDisplayEvent(nextEvent || recentlyStartedEvent || null);
  }, [nextEvent, events, RECENTLY_STARTED_THRESHOLD_MS]);

  if (!icsUrl || !calendarEnabled) {
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

  if (!displayEvent || minutesLeft === null || minutesLeft > 24 * 60) {
    const handleClick = () => {
      setCalendarVisible(true);
    };

    return (
      <div
        className={cn(
          "fixed inset-x-0 flex items-center w-full max-w-48 mx-auto px-3 bg-black/75 backdrop-blur-sm rounded-2xl text-white text-sm font-medium -translate-y-1/2 pt-4 pb-1 transition-all cursor-pointer hover:bg-black/90",
          hasBookmarksBarVisible ? "top-8" : "top-0"
        )}
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

  const now = new Date();
  const isHappening = isEventHappening(displayEvent, now);
  const isAllDay = isAllDayEvent(displayEvent);
  const timeText = isHappening
    ? "Now"
    : isAllDay
      ? "Today"
      : formatTime(minutesLeft);

  const eventIsToday = displayEvent ? isEventToday(displayEvent, now) : false;
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
      className={cn(
        "fixed inset-x-0 flex items-center w-full max-w-48 mx-auto px-3 bg-black/75 backdrop-blur-sm rounded-2xl text-white text-sm font-medium -translate-y-1/2 pt-4 pb-1 transition-all cursor-pointer hover:bg-black/90",
        hasBookmarksBarVisible ? "top-8" : "top-0"
      )}
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
