import { memo } from "react";

import { NextPinnedTask } from "./next-pinned-task";

export const TimerExpandedContent = memo(() => {
  return (
    <div className="space-y-4">
      <NextPinnedTask />
    </div>
  );
});
