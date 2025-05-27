import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { motion } from "framer-motion";

import { PomodoroStage } from "../../../../types/pomodoro";
import { cn } from "../../../../lib";
import { Icons } from "../../../../components/icons";
import { usePomodoroStore } from "../../../../stores/unified-pomodoro.store";

import { TimerDonutGraph } from "./timer-donut-graph";

export const TimerControls = ({
  percentage,
  isRunning,
  onToggle,
  onReset,
}: {
  percentage: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}) => {
  const activeStage = usePomodoroStore((state) => state.activeStage);

  const isBreak = activeStage === PomodoroStage.Break;

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex items-center justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center rounded-full bg-gray-300 p-2 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
            >
              <Icons.timerOff className="h-4 w-4" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Reset Current Session</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        className={cn("flex items-center justify-center", {
          "text-green-500 dark:text-green-500": isBreak,
          "text-blue-500 dark:text-blue-500": !isBreak,
        })}
      >
        <TimerDonutGraph percentage={percentage}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="absolute inset-0 flex items-center justify-center rounded-full p-1 text-black dark:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
              >
                {isRunning ? (
                  <Icons.pause className="size-4" />
                ) : (
                  <Icons.play className="ml-0.5 size-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p> {isRunning ? "Pause" : "Start"}</p>
            </TooltipContent>
          </Tooltip>
        </TimerDonutGraph>
      </div>
    </div>
  );
};
