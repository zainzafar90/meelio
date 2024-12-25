import { useEffect, useState } from "react";

import NumberFlow from "@number-flow/react";

export const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <h1 className="text-shadow-lg text-5xl sm:text-7xl md:text-9xl font-semibold flex tracking-wider text-white/90">
      <div className="flex items-center justify-center">
        <NumberFlow
          value={time.getHours()}
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
