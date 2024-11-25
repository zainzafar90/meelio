import { useEffect, useMemo, useState } from "react";

import { toZonedTime } from "date-fns-tz";

import { cn } from "@/lib/utils";

const CLOCK_UPDATE_INTERVAL = 1000;

const getLocalTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const ClockDock = () => {
  const timezone = useMemo(() => {
    return getLocalTimezone();
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentTime(new Date()),
      CLOCK_UPDATE_INTERVAL
    );
    return () => clearInterval(timer);
  }, []);

  const zonedTime = toZonedTime(currentTime, timezone);
  const hourDegrees =
    ((zonedTime.getHours() % 12) + zonedTime.getMinutes() / 60) * 30;
  const minuteDegrees =
    (zonedTime.getMinutes() + zonedTime.getSeconds() / 60) * 6;
  const secondDegrees = zonedTime.getSeconds() * 6;

  const isDaytime = !(zonedTime.getHours() >= 7 && zonedTime.getHours() < 19);

  const clockFaceClass = isDaytime
    ? "bg-white text-black"
    : "bg-zinc-700 text-white";

  const handClass = isDaytime ? "bg-black" : "bg-white";

  return (
    <div
      className={cn(
        "size-10 rounded-xl shadow-lg",
        "hidden items-center justify-center sm:flex",
        "bg-gradient-to-b from-zinc-800 to-zinc-900"
      )}
    >
      <div className="relative flex aspect-square w-7 items-center justify-center rounded-full">
        <div
          className={cn(
            "relative flex aspect-square w-full items-center justify-center rounded-full",
            clockFaceClass
          )}
        >
          {/* Hour hand */}
          <div
            className={cn(
              "absolute h-[32%] w-0.5 origin-bottom rounded-full",
              handClass
            )}
            style={{ transform: `translateY(-50%) rotate(${hourDegrees}deg)` }}
          />

          {/* Minute hand */}
          <div
            className={cn(
              "absolute h-[44%] w-0.5 origin-bottom rounded-full",
              handClass
            )}
            style={{
              transform: `translateY(-50%) rotate(${minuteDegrees}deg)`,
            }}
          />

          {/* Second hand */}
          <div
            className="absolute h-[48%] w-0.5 origin-bottom rounded-full bg-orange-400"
            style={{
              transform: `translateY(-50%) rotate(${secondDegrees}deg)`,
            }}
          />

          {/* Center dot */}
          <div
            className={cn(
              "absolute flex h-1.5 w-1.5 items-center justify-center rounded-full",
              handClass
            )}
          >
            <div className={cn("h-0.5 w-0.5 rounded-full", clockFaceClass)} />
          </div>
        </div>
      </div>
    </div>
  );
};
