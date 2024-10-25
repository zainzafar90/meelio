import { useEffect, useState } from "react";

import { differenceInCalendarDays, differenceInHours, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { MoonIcon, SunIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const CLOCK_UPDATE_INTERVAL = 1000;
interface ClockProps {
  timezone: string;
  isLocalTimezone?: boolean;
}

export const Clock = ({ timezone, isLocalTimezone }: ClockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentTime(new Date()),
      CLOCK_UPDATE_INTERVAL
    );
    return () => clearInterval(timer);
  }, []);

  const zonedTime = toZonedTime(currentTime, timezone);
  const timeDifference = differenceInHours(zonedTime, currentTime);
  const dayDifference = differenceInCalendarDays(zonedTime, currentTime);

  const hourDegrees =
    ((zonedTime.getHours() % 12) + zonedTime.getMinutes() / 60) * 30;
  const minuteDegrees =
    (zonedTime.getMinutes() + zonedTime.getSeconds() / 60) * 6;
  const secondDegrees = zonedTime.getSeconds() * 6;

  const getDayStatus = () => {
    if (dayDifference === 0) return "Today";
    if (dayDifference === 1) return "Tomorrow";
    if (dayDifference === -1) return "Yesterday";
    return format(zonedTime, "MMM d");
  };

  const isDaytime = zonedTime.getHours() >= 7 && zonedTime.getHours() < 19;

  const clockFaceClass = isDaytime
    ? "bg-white text-black"
    : "bg-stone-900 text-white";

  const handClass = isDaytime ? "bg-black" : "bg-white";

  return (
    <div className="w-full aspect-square flex flex-col items-center justify-center space-y-4">
      <div className="relative z-10 w-full max-w-xs aspect-square p-6 flex items-center justify-center bg-black rounded-[4rem] shadow-lg shadow-zinc-900">
        <div
          className={cn(
            "relative w-full aspect-square rounded-full flex items-center justify-center p-2",
            clockFaceClass
          )}
        >
          {/* Clock numbers */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-full"
              style={{ transform: `rotate(${30 * i}deg)` }}
            >
              <span className="p-2 absolute top-1 left-1/2 -translate-x-1/2 -translate-y-1 text-2xl font-semibold">
                {i === 0 ? "12" : i}
              </span>
            </div>
          ))}

          {/* Hour hand */}
          <div
            className={cn(
              "absolute w-1 h-[32%] rounded-full origin-bottom",
              handClass
            )}
            style={{ transform: `translateY(-50%) rotate(${hourDegrees}deg)` }}
          >
            <div
              className={cn(
                "absolute w-2 h-[75%] -left-0.5 rounded-full",
                handClass
              )}
            />
          </div>

          {/* Minute hand */}
          <div
            className={cn(
              "absolute w-1 h-[44%] rounded-full origin-bottom",
              handClass
            )}
            style={{
              transform: `translateY(-50%) rotate(${minuteDegrees}deg)`,
            }}
          >
            <div
              className={cn(
                "absolute w-2 h-[75%] -left-0.5 rounded-full",
                handClass
              )}
            />
          </div>

          {/* Second hand */}
          <div
            className="absolute w-0.5 h-[48%] bg-orange-500 rounded-full origin-bottom"
            style={{
              transform: `translateY(-50%) rotate(${secondDegrees}deg)`,
            }}
          />

          {/* Center dot */}
          <div
            className={cn(
              "absolute w-3 h-3 rounded-full flex items-center justify-center",
              handClass
            )}
          >
            <div className={cn("w-1 h-1 rounded-full", clockFaceClass)} />
          </div>

          {/* Center dot */}
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1.5 -translate-y-20 w-3 h-3 rounded-full flex items-center justify-center"
            )}
          ></div>
        </div>
      </div>
      <div className="relative -top-8 max-w-64 w-full flex flex-col items-center justify-center space-y-2 py-6 rounded-b-2xl bg-black/75 backdrop-blur-lg shadow-lg">
        <h2 className="flex items-center gap-2 text-md font-medium text-white">
          {timezone}{" "}
          <span>
            {isDaytime ? (
              <SunIcon className="size-4 text-white/70" />
            ) : (
              <MoonIcon className="size-4 text-white/70" />
            )}
          </span>
        </h2>
        {!isLocalTimezone ? (
          <div className="text-center space-y-2">
            <p className="text-xs text-white/70 font-medium">
              {getDayStatus()}
            </p>
            <p className="text-xs text-white/60 uppercase font-medium">
              {timeDifference > 0 ? `+${timeDifference}` : timeDifference} hrs
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-xs text-white/70 font-medium">Current</p>
            <p className="text-xs text-white/50 uppercase font-medium">
              &mdash;
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
