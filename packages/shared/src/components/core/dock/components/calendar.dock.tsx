import { useEffect, useState } from "react";

import { cn } from "@repo/ui/lib/utils";
import { useTranslation } from "react-i18next";
import { useDockStore } from "../../../../stores/dock.store";
import { useShallow } from "zustand/shallow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

export const CalendarDock = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());
  const { toggleCalendar } = useDockStore(
    useShallow((state) => ({
      toggleCalendar: state.toggleCalendar,
    }))
  );

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

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group">
            <div
              onClick={() => toggleCalendar?.()}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl shadow-lg",
                "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900",
                "flex-col overflow-hidden",
                "transition-all duration-200 group-hover:translate-y-0 group-hover:scale-105"
              )}
            >
              <div className="w-full bg-red-600 pt-0.5 text-center text-xxs font-bold uppercase text-white">
                {month}
              </div>
              <div className="flex flex-grow items-center justify-center">
                <span className="text-base font-light text-white">{day}</span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-3 py-1.5 px-2.5">
          <span className="text-sm">{t("common.calendar", { defaultValue: "Calendar" })}</span>
          <div className="flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-mono font-medium text-zinc-300 bg-zinc-700/80 border border-zinc-600 rounded shadow-sm">
              {isMac ? "⌘" : "⌃"}
            </kbd>
            <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono font-medium text-zinc-300 bg-zinc-700/80 border border-zinc-600 rounded shadow-sm">
              0
            </kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
