import { useEffect, useState } from "react";

import { cn } from "@repo/ui/lib/utils";
import { useTranslation } from "react-i18next";
import { useCalendarStore } from "../../../stores/calendar.store";

export const CalendarDock = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());
  const { nextEvent, fetchEvents } = useCalendarStore((state) => ({
    nextEvent: state.nextEvent,
    fetchEvents: state.fetchEvents,
  }));
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  useEffect(() => {
    if (!nextEvent) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const diff = new Date(nextEvent.start).getTime() - Date.now();
      setTimeLeft(Math.max(Math.ceil(diff / 60000), 0));
    };

    update();
    const id = setInterval(update, 60 * 1000);
    return () => clearInterval(id);
  }, [nextEvent]);

  const month = t(
    `common.calendarData.months.short.${date
      .toLocaleString("default", { month: "short" })
      .toLowerCase()}`,
  );
  const day = date.getDate();

  return (
    <div
      className={cn(
        "relative flex size-10 items-center justify-center rounded-xl shadow-lg",
        "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900",
        "flex-col overflow-hidden",
      )}
      title={`${month} ${day}`}
    >
      <div className="w-full bg-red-600 pt-0.5 text-center text-xxs font-bold uppercase text-white">
        {month}
      </div>
      <div className="flex flex-grow items-center justify-center">
        <span className="text-base font-light text-white">{day}</span>
      </div>
      {timeLeft !== null && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xxs font-bold text-white">
          {timeLeft}
        </span>
      )}
    </div>
  );
};
