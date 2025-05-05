import { memo } from "react";
import { useShallow } from "zustand/shallow";

import { PomodoroStage } from "../../../../types/pomodoro";
import { usePomodoroStore } from "../../../../stores/pomodoro.store";
import { cn } from "../../../../lib";
import { Icons } from "../../../../components/icons";

import { TimerSessionIndicators } from "./timer-session-indicators";
import { TimerStageButton } from "./timer-stage-button";
import { TimerStats } from "./timer-stats";

export const TimerExpandedContent = memo(() => {
  const { timer, changeStage } = usePomodoroStore(
    useShallow((state) => ({
      timer: state.timer,
      changeStage: state.changeStage,
    }))
  );

  return (
    <div className="space-y-4">
      <TimerSessionIndicators sessionCount={timer.sessionCount} />

      <div className="grid grid-cols-3 gap-3">
        {[PomodoroStage.Focus, PomodoroStage.Break].map((stage, index) => (
          <TimerStageButton
            key={stage}
            stage={stage}
            activeStage={timer.activeStage}
            stageSeconds={timer.stageSeconds[stage]}
            onClick={changeStage}
            delay={0.1 * (index + 1)}
          />
        ))}
      </div>

      <TimerStats />
    </div>
  );
});
