import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { useCalendarStore } from "../../../stores/calendar.store";
import { useDockStore } from "../../../stores/dock.store";
import { getCalendarColor } from "../../../utils/calendar-colors";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../lib/utils";

/**
 * Dynamic island component displaying upcoming calendar events
 */
export const CalendarDynamicIsland = () => {
  const { getMinutesUntilNextEvent, nextEvent } = useCalendarStore(
    useShallow((state) => ({
      getMinutesUntilNextEvent: state.getMinutesUntilNextEvent,
      nextEvent: state.nextEvent,
    }))
  );

  const { setCalendarVisible } = useDockStore(
    useShallow((state) => ({
      setCalendarVisible: state.setCalendarVisible,
    }))
  );

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

  if (!nextEvent || minutesLeft === null) {
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

  const eventColor = getCalendarColor(nextEvent.colorId);

  const handleClick = () => {
    setCalendarVisible(true);
  };

  return (
    <div
      className="flex items-center w-full max-w-48 px-3 bg-black/70 backdrop-blur-sm rounded-2xl text-white text-sm font-medium -translate-y-1/2 pt-4 pb-1 transition-all cursor-pointer hover:bg-black/80"
      title={`Next event: ${nextEvent.summary} in ${formatTime(minutesLeft)}`}
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${nextEvent.summary}-${eventColor}-${nextEvent.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex justify-between w-full mt-4"
        >
          <div className="flex items-center gap-2 ">
            <div
              className={cn(
                "size-2.5 rounded-full",
                minutesLeft < 10 && "animate-pulse"
              )}
              style={{ backgroundColor: eventColor }}
              aria-hidden="true"
            />
            <span className="truncate max-w-32 text-xs">
              {nextEvent.summary || "Event"}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-auto pl-3 text-xs opacity-80">
            {formatTime(minutesLeft)}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
