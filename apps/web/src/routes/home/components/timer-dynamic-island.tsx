import { memo, useEffect, useRef, useState } from "react";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";

import { Category } from "@/types/category";
import { PomodoroStage, PomodoroStageMap } from "@/types/pomodoro";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePomodoroStore } from "@/stores/pomodoro.store";
import { useSoundscapesStore } from "@/stores/soundscapes.store";
import { getTime } from "@/utils/timer.utils";

import { TimerStageButton } from "./timer/timer-stage-button";
import { TimerStats } from "./timer/timer-stats";

export const TimerDynamicIsland = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    changeStage,
    completeSession,
    loadTodayStats,
  } = usePomodoroStore();
  const { playCategory, pausePlayingSounds } = useSoundscapesStore((state) => ({
    playCategory: state.playCategory,
    pausePlayingSounds: state.pausePlayingSounds,
  }));

  const isBreak =
    timer.activeStage === PomodoroStage.ShortBreak ||
    timer.activeStage === PomodoroStage.LongBreak;

  const [minutesTens, minutesUnit, secondsTens, secondsUnit] = getTime(
    timer.remaining
  );

  const getPercentage = () => {
    const totalTime = timer.stageSeconds[timer.activeStage];
    return (timer.remaining / totalTime) * 100;
  };

  const handleToggle = () => {
    if (timer.running) {
      pauseTimer();
      pausePlayingSounds();
    } else if (timer.remaining === timer.stageSeconds[timer.activeStage]) {
      startTimer();
      if (timer.activeStage === PomodoroStage.WorkTime) {
        playCategory(Category.BeautifulAmbients);
      }
    } else {
      resumeTimer();
      if (timer.activeStage === PomodoroStage.WorkTime) {
        playCategory(Category.BeautifulAmbients);
      }
    }
  };

  const handleReset = () => {
    changeStage(PomodoroStage.WorkTime);
  };

  useEffect(() => {
    loadTodayStats();
  }, []);

  useEffect(() => {
    if (timer.remaining === 0) {
      completeSession();
    }
  }, [timer.remaining, completeSession]);

  useEffect(() => {
    pausePlayingSounds();

    if (timer.running && timer.activeStage === PomodoroStage.WorkTime) {
      playCategory(Category.BeautifulAmbients);
    }
  }, [timer.activeStage, timer.running, pausePlayingSounds, playCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDialogOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <motion.div className="absolute left-1/2 top-1 z-10 w-full max-w-sm -translate-x-1/2">
      <AnimatePresence mode="wait">
        <motion.div
          ref={containerRef}
          layout
          className="min-w-60 rounded-xl bg-white backdrop-blur-xl dark:bg-black"
          // initial={{
          //   borderRadius: isExpanded ? "28px" : "24px",
          //   width: "100%",
          // }}
          // animate={{
          //   borderRadius: isExpanded ? "24px" : "28px",
          //   width: "95%",
          // }}
          // exit={{
          //   borderRadius: isExpanded ? "28px" : "24px",
          //   width: "100%",
          // }}
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 30,
            duration: 1,
          }}
          onClick={() => setIsDialogOpen(true)}
        >
          {/* Main Status Bar */}
          <motion.div
            className="flex cursor-pointer items-center justify-between p-3"
            layout="position"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isBreak ? "break" : "focus"}
                className={cn(
                  "flex size-12 items-center justify-center rounded-xl text-xl",
                  isBreak ? "bg-green-200/20" : "bg-red-200/20"
                )}
                whileTap={{ scale: 0.95 }}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 5, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 50,
                  duration: 0.25,
                }}
              >
                {isBreak ? "☕️" : "🎯"}
              </motion.div>
            </AnimatePresence>

            <motion.div className="mx-3 flex-1" layout="position">
              <AnimatePresence mode="wait">
                <motion.p
                  key={isBreak ? "break" : "focus"}
                  className="text-md font-bold text-black dark:text-white sm:text-2xl"
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 5, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 50,
                    duration: 0.25,
                  }}
                >
                  <NumberFlow
                    value={minutesTens}
                    format={{ notation: "compact" }}
                    locales="en-US"
                    trend="decreasing"
                  />
                  <NumberFlow
                    value={minutesUnit}
                    format={{ notation: "compact" }}
                    locales="en-US"
                    trend="decreasing"
                  />
                  :
                  <NumberFlow
                    value={secondsTens}
                    format={{ notation: "compact" }}
                    locales="en-US"
                    trend="decreasing"
                  />
                  <NumberFlow
                    value={secondsUnit}
                    format={{ notation: "compact" }}
                    locales="en-US"
                    trend="decreasing"
                  />
                </motion.p>
              </AnimatePresence>
              <motion.p
                key={isBreak ? "break" : "focus"}
                className="text-[8px] uppercase text-black/90 dark:text-white/90"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 5, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 50,
                  duration: 0.25,
                }}
              >
                {PomodoroStageMap[timer.activeStage]}
              </motion.p>
            </motion.div>
            <PomodoroControls
              isRunning={timer.running}
              onToggle={handleToggle}
              onReset={handleReset}
              percentage={getPercentage()}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent showClose={false} className="sm:max-w-sm">
          <TimerExpandedContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const BatteryCircle = (props: {
  percentage: number;
  children: React.ReactNode;
}) => {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (props.percentage / 100) * circumference;

  return (
    <motion.div
      className="relative h-12 w-12"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <svg className="h-full w-full -rotate-90 transform">
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="#555"
          strokeOpacity="0.5"
          strokeWidth="5"
          fill="transparent"
          className="text-gray-700"
        />
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </svg>

      {props.children}
    </motion.div>
  );
};

const PomodoroControls = ({
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
  const { timer } = usePomodoroStore((state) => ({
    timer: state.timer,
  }));

  const isBreak =
    timer.activeStage === PomodoroStage.ShortBreak ||
    timer.activeStage === PomodoroStage.LongBreak;

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
        <BatteryCircle percentage={percentage}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
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
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p> {isRunning ? "Pause" : "Start"}</p>
            </TooltipContent>
          </Tooltip>
        </BatteryCircle>
      </div>
    </div>
  );
};

const SessionIndicators = ({
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

const TimerExpandedContent = memo(() => {
  const { timer, changeStage } = usePomodoroStore((state) => ({
    timer: state.timer,
    changeStage: state.changeStage,
  }));

  return (
    <div className="space-y-4">
      <SessionIndicators
        sessionCount={timer.sessionCount}
        longBreakInterval={timer.longBreakInterval}
        activeStage={timer.activeStage}
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          PomodoroStage.WorkTime,
          PomodoroStage.ShortBreak,
          PomodoroStage.LongBreak,
        ].map((stage, index) => (
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
