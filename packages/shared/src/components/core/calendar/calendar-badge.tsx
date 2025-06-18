import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

import { useCalendarStore } from "../../../stores/calendar.store";

interface CalendarBadgeProps {
  className?: string;
}

/**
 * Display minutes until next calendar event as a badge
 */
export const CalendarBadge = ({ className = "" }: CalendarBadgeProps) => {
  const { getMinutesUntilNextEvent, nextEvent } = useCalendarStore(
    useShallow((state) => ({
      getMinutesUntilNextEvent: state.getMinutesUntilNextEvent,
      nextEvent: state.nextEvent,
    }))
  );

  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    const updateMinutes = () => {
      const minutes = getMinutesUntilNextEvent();
      setMinutesLeft(minutes);
    };

    // Update immediately
    updateMinutes();

    // Update every minute
    const interval = setInterval(updateMinutes, 60000);

    return () => clearInterval(interval);
  }, [getMinutesUntilNextEvent, nextEvent]);

  if (!nextEvent || minutesLeft === null || minutesLeft <= 0) {
    return null;
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-blue-500 rounded-full ${className}`}
      title={`Next event: ${nextEvent.summary} in ${formatTime(minutesLeft)}`}
    >
      {formatTime(minutesLeft)}
    </div>
  );
};