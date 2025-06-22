import { useState } from "react";

import NumberFlow from "@number-flow/react";
import { useInterval } from "usehooks-ts";
import { useAppStore } from "../../../stores/app.store";
import { useShallow } from "zustand/shallow";
import { ShadowOverlay } from "../backgrounds/components/shadow-overlay";

export const Clock = () => {
  const { twelveHourClock } = useAppStore(
    useShallow((state) => ({
      twelveHourClock: state.twelveHourClock,
    }))
  );
  const [time, setTime] = useState(new Date());

  useInterval(() => setTime(new Date()), 1000);

  return (
    <h1 className="relative text-shadow-lg text-5xl sm:text-7xl md:text-9xl font-semibold flex tracking-tighter text-white">
      <div className="flex items-center justify-center">
        <ShadowOverlay />
        <NumberFlow
          value={twelveHourClock ? time.getHours() % 12 || 12 : time.getHours()}
          format={{ notation: "standard", minimumIntegerDigits: 2 }}
          locales="en-US"
        />
        <span className="text-5xl sm:text-7xl md:text-9xl font-semibold mx-1 relative z-10">
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
