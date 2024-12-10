import { PomodoroStage } from "../../../../types/pomodoro";
import { Icons } from "../../../../components/icons";

export const TimerSessionIndicators = ({
  sessionCount,
  longBreakInterval,
  activeStage,
}: {
  sessionCount: number;
  longBreakInterval: number;
  activeStage: PomodoroStage;
}) => {
  const completedIntervals = Math.floor(sessionCount / longBreakInterval);
  const currentIntervalSessions = sessionCount % longBreakInterval;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-gray-200/50 p-3 dark:bg-gray-800/50">
      <div className="flex gap-2">
        {Array(longBreakInterval)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="flex size-5 items-center justify-center"
            >
              {index < currentIntervalSessions ||
              activeStage === PomodoroStage.LongBreak ? (
                <Icons.checkFilled className="size-5 text-green-500" />
              ) : (
                <div className="size-4 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              )}
            </div>
          ))}
      </div>
      <div className="ml-auto flex items-center gap-1">
        🔥
        <span className="ml-1 text-sm font-medium">{completedIntervals}</span>
      </div>
    </div>
  );
};
