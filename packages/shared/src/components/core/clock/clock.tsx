import { useState } from "react";

import NumberFlow from "@number-flow/react";
import { useInterval } from "usehooks-ts";
import { useAppStore } from "../../../stores/app.store";
import { useShallow } from "zustand/shallow";

export const Clock = () => {
  const { twelveHourClock } = useAppStore(
    useShallow((state) => ({
      twelveHourClock: state.twelveHourClock,
    }))
  );
  const [time, setTime] = useState(new Date());

  useInterval(() => setTime(new Date()), 1000);

  return (
    <h1 className="text-shadow-lg text-5xl sm:text-7xl md:text-9xl font-semibold flex tracking-tighter text-white/90">
      <div className="flex items-center justify-center">
        <NumberFlow
          value={twelveHourClock ? time.getHours() % 12 || 12 : time.getHours()}
          format={{ notation: "standard", minimumIntegerDigits: 2 }}
          locales="en-US"
        />
        <span className="text-5xl sm:text-7xl md:text-9xl font-semibold mx-1">
          :
        </span>
        <NumberFlow
          value={time.getMinutes()}
          format={{ notation: "standard", minimumIntegerDigits: 2 }}
          locales="en-US"
        />
      </div>
    </h1>
  );
};
