import { CheckCircle2 } from "lucide-react";

import { Timer } from "@/components/pomodoro/timer";
import { AppLayout } from "@/layouts/app-layout";
import { usePomodoroStore } from "@/store/pomodoro.store";

const Pomodoro = () => {
  const { timer } = usePomodoroStore();

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
}> = ({ sessionCount, longBreakInterval }) => {
  const completedIntervals = Math.floor(sessionCount / longBreakInterval);
  const currentIntervalSessions = sessionCount % longBreakInterval;

  const renderSessionIndicators = () => {
    return Array(longBreakInterval)
      .fill(0)
      .map((_, index) => (
        <div key={index} className="w-5 h-5 flex items-center justify-center">
          {index < currentIntervalSessions || index === 4 ? (
            <CheckCircle2 className="text-green-600 w-5 h-5" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
          )}
        </div>
      ));
  };

  return (
    <div className="absolute right-12 bottom-2 text-white">
      <div className="flex justify-center mt-4 max-w-xs mx-auto gap-2">
        <div className="flex justify-center items-center space-x-3 mb-2 bg-zinc-900 p-2 rounded-md backdrop-blur-lg bg-opacity-50">
          {renderSessionIndicators()}
        </div>
        <div className="flex justify-center items-center space-x-1 mb-2 bg-zinc-900 p-2 rounded-md  backdrop-blur-lg bg-opacity-50">
          🔥
          <span className="text-sm font-medium ml-1">{completedIntervals}</span>
        </div>
      </div>
    </div>
  );
};

export default Pomodoro;
