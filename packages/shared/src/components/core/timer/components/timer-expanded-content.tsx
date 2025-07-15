import { memo } from "react";

import { NextPinnedTask } from "./timer-next-task";
import { TimerStats } from "./timer-stats";

export const TimerExpandedContent = memo(() => {
  return (
    <div className="space-y-4">
      <NextPinnedTask />
      <TimerStats />
    </div>
  );
});
