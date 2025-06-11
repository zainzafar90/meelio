import { memo } from "react";
import { useShallow } from "zustand/shallow";

import { usePomodoroStore } from "../../../../stores/unified-pomodoro.store";

import { TimerSessionIndicators } from "./timer-session-indicators";
import { TimerStats } from "./timer-stats";
import { NextPinnedTask } from "./next-pinned-task";

export const TimerExpandedContent = memo(() => {
  const { activeStage, sessionCount, stageDurations } = usePomodoroStore(
    useShallow((state) => ({
      activeStage: state.activeStage,
      sessionCount: state.sessionCount,
      stageDurations: state.stageDurations,
      changeStage: state.changeStage,
    }))
  );

  const timer = {
    activeStage,
    sessionCount,
    stageSeconds: stageDurations,
  };

  return (
    <div className="space-y-4">
      <TimerSessionIndicators sessionCount={timer.sessionCount} />
      <NextPinnedTask />
      <TimerStats />
    </div>
  );
});
