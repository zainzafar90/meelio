import { useEffect, useState } from "react";

import NumberFlow from "@number-flow/react";

export const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <h1 className="text-shadow-lg text-md flex font-mono font-semibold tracking-wide text-white/90">
      <div className="w-10">
        <NumberFlow
          value={time.getHours()}
          format={{ notation: "standard", minimumIntegerDigits: 2 }}
          locales="en-US"
        />
        <span className="text-xxs uppercase">h</span>
      </div>
      {/* <span>:</span> */}
      <div className="w-10">
        <NumberFlow
          value={time.getMinutes()}
          format={{ notation: "standard", minimumIntegerDigits: 2 }}
          locales="en-US"
        />
        <span className="text-xxs uppercase">m</span>
      </div>
      <div className="w-10">
        <NumberFlow
          value={time.getSeconds()}
          format={{ notation: "standard", minimumIntegerDigits: 2 }}
          locales="en-US"
        />
        <span className="text-xxs uppercase">s</span>
      </div>
    </h1>
  );
};
