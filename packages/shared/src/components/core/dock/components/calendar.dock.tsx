import { useEffect, useState } from "react";

import { cn } from "@repo/ui/lib/utils";
import { useTranslation } from "react-i18next";
import { CalendarBadge } from "../../calendar/calendar-badge";

export const CalendarDock = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const month = t(
    `common.calendarData.months.short.${date
      .toLocaleString("default", { month: "short" })
      .toLowerCase()}`
  );
  const day = date.getDate();

  return (
    <div className="relative">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-xl shadow-lg",
          "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900",
          "flex-col overflow-hidden"
        )}
        title={`${month} ${day}`}
      >
        <div className="w-full bg-red-600 pt-0.5 text-center text-xxs font-bold uppercase text-white">
          {month}
        </div>
        <div className="flex flex-grow items-center justify-center">
          <span className="text-base font-light text-white">{day}</span>
        </div>
      </div>
      <CalendarBadge className="absolute -top-2 -right-2" />
    </div>
  );
};
