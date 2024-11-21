import { motion } from "framer-motion";

import { PomodoroStage, PomodoroStageMap } from "@/types/pomodoro";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";

interface TimerStageButtonProps {
  stage: PomodoroStage;
  activeStage: PomodoroStage;
  stageSeconds: number;
  onClick: (stage: PomodoroStage) => void;
  delay?: number;
}

export const TimerStageButton = ({
  stage,
  activeStage,
  stageSeconds,
  onClick,
  delay = 0,
}: TimerStageButtonProps) => {
  const isWorkStage = stage === PomodoroStage.WorkTime;
  const isActive = activeStage === stage;

  return (
    <motion.button
      onClick={() => onClick(stage)}
      className={cn(
        "relative bg-gray-100 dark:bg-gray-900 rounded-xl p-3 text-left transition-colors hover:opacity-80",
        isActive && "bg-gray-200 dark:bg-gray-800"
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay }}
      whileTap={{ scale: 0.95 }}
    >
      <h3 className="text-black dark:text-white text-sm font-medium mb-1">
        {PomodoroStageMap[stage]}
      </h3>
      <p
        className={cn(
          "text-base font-bold",
          isWorkStage
            ? "text-blue-500 dark:text-blue-400"
            : "text-green-500 dark:text-green-400"
        )}
      >
        {Math.floor(stageSeconds / 60)}m
      </p>
      {isActive && (
        <div className="absolute bottom-4 right-4">
          <Icons.checkFilled className="w-4 h-4" />
        </div>
      )}
    </motion.button>
  );
};
