import { PomodoroStage } from "@/types/pomodoro";
import { Icons } from "@/components/icons/icons";
import { Timer } from "@/components/pomodoro/timer";
import { AppLayout } from "@/layouts/app-layout";
import { usePomodoroStore } from "@/store/pomodoro.store";

export const Pomodoro = () => {
  const timer = usePomodoroStore((state) => state.timer);

  return (
    <AppLayout>
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
        style={{
          backgroundImage: "url('./img/bg-01.webp')",
        }}
      >
        <div className="bg-black bg-opacity-50 p-8 rounded-lg backdrop-blur-lg">
          <Timer />
        </div>

        <SessionProgress
          activeStage={timer.activeStage}
          sessionCount={timer.sessionCount}
          longBreakInterval={timer.longBreakInterval}
        />
      </div>
    </AppLayout>
  );
};

const SessionProgress: React.FC<{
  sessionCount: number;
  longBreakInterval: number;
  activeStage: PomodoroStage;
}> = ({ sessionCount, longBreakInterval, activeStage }) => {
  const completedIntervals = Math.floor(sessionCount / longBreakInterval);
  const currentIntervalSessions = sessionCount % longBreakInterval;

  const renderSessionIndicators = () => {
    return Array(longBreakInterval)
      .fill(0)
      .map((_, index) => (
        <div key={index} className="size-5 flex items-center justify-center">
          {index < currentIntervalSessions ||
          activeStage === PomodoroStage.LongBreak ? (
            <Icons.checkFilled className="text-green-500 size-5" />
          ) : (
            <div className="size-4 rounded-full bg-zinc-300" />
          )}
        </div>
      ));
  };

  return (
    <div className="absolute right-12 bottom-2 text-white">
      <div className="flex justify-center mt-4 max-w-xs mx-auto gap-2">
        <div className="flex justify-center items-center space-x-3 mb-2 bg-black p-2 rounded-md backdrop-blur-lg bg-opacity-80">
          {renderSessionIndicators()}
        </div>
        <div className="flex justify-center items-center space-x-1 mb-2 bg-black p-2 rounded-md backdrop-blur-lg bg-opacity-80">
          🔥
          <span className="text-sm font-medium ml-1">{completedIntervals}</span>
        </div>
      </div>
    </div>
  );
};
