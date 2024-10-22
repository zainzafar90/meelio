import { useEffect, useState } from "react";

import { differenceInCalendarDays, differenceInHours, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface ClockProps {
  timezone: string;
  isLocalTimezone?: boolean;
}

export const Clock = ({ timezone, isLocalTimezone }: ClockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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

  return (
    <div className="w-full aspect-square flex flex-col items-center justify-center space-y-4">
      <div className="relative z-10 w-full max-w-xs aspect-square p-4 flex items-center justify-center bg-black rounded-3xl shadow-lg shadow-zinc-900">
        <div className="relative w-full dark:bg-white bg-stone-700 aspect-square rounded-full flex items-center justify-center p-2">
          {/* Clock numbers */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-full"
              style={{ transform: `rotate(${30 * i}deg)` }}
            >
              <span className="text-background p-2 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-2xl font-semibold">
                {i === 0 ? "12" : i}
              </span>
            </div>
          ))}

          {/* Hour hand */}
          <div
            className="absolute w-1 h-[32%] bg-white dark:bg-black rounded-full origin-bottom"
            style={{ transform: `translateY(-50%) rotate(${hourDegrees}deg)` }}
          >
            <div className="absolute w-2 h-[75%] -left-0.5 bg-white dark:bg-black rounded-full" />
          </div>

          {/* Minute hand */}
          <div
            className="absolute w-1 h-[44%] bg-white dark:bg-black rounded-full origin-bottom"
            style={{
              transform: `translateY(-50%) rotate(${minuteDegrees}deg)`,
            }}
          >
            <div className="absolute w-2 h-[75%] -left-0.5 bg-white dark:bg-black rounded-full" />
          </div>

          {/* Second hand */}
          <div
            className="absolute w-0.5 h-[48%] bg-orange-500 rounded-full origin-bottom"
            style={{
              transform: `translateY(-50%) rotate(${secondDegrees}deg)`,
            }}
          />

          {/* Center dot */}
          <div className="absolute w-3 h-3 bg-white dark:bg-black rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-black dark:bg-white rounded-full" />
          </div>
        </div>
      </div>
      <div className="relative -top-4 max-w-64 w-full flex flex-col items-center justify-center space-y-2 py-6 rounded-b-2xl bg-background/75 backdrop-blur-lg shadow-lg">
        <h2 className="text-md font-medium">{timezone}</h2>
        {!isLocalTimezone ? (
          <div className="text-center space-y-2">
            <p className="text-xs text-foreground/70 uppercase font-medium">
              {getDayStatus()}
            </p>
            <p className="text-xs text-foreground/70 uppercase font-medium">
              {timeDifference > 0 ? `+${timeDifference}` : timeDifference} hrs
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-xs text-foreground/70 uppercase font-medium">
              Current
            </p>
            <p className="text-xs text-foreground/70 uppercase font-medium">
              Local Time
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
