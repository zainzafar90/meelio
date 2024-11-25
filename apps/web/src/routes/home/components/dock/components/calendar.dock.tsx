import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export const CalendarDock = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const month = t(
    `common.calendar.months.short.${date
      .toLocaleString("default", { month: "short" })
      .toLowerCase()}`
  );
  const day = date.getDate();

  return (
    <div
      className={cn(
        "relative flex size-10 cursor-pointer flex-col overflow-hidden rounded-xl bg-zinc-900 shadow-lg",
        "bg-gradient-to-b from-zinc-800 to-zinc-900"
      )}
      title={`${month} ${day}`}
    >
      <div className="bg-red-600 pt-0.5 text-center text-xxs font-bold uppercase text-white">
        {month}
      </div>
      <div className="flex flex-grow items-center justify-center">
        <span className="text2xl font-light text-white">{day}</span>
      </div>
    </div>
  );
};
