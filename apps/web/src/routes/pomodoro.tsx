import { LucideProps } from "lucide-react";

import { Timer } from "@/components/pomodoro/timer";
import { AppLayout } from "@/layouts/app-layout";
import { usePomodoroStore } from "@/store/pomodoro.store";

const Pomodoro = () => {
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
        <div key={index} className="size-5 flex items-center justify-center">
          {index < currentIntervalSessions || index === 4 ? (
            <CheckFill className="text-green-500 size-5" />
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

export const CheckFill = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14m3.844-8.791a.75.75 0 0 0-1.187-.918l-3.7 4.79l-1.65-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Pomodoro;
