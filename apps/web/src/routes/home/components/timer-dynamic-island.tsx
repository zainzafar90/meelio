import { memo, useEffect, useRef, useState } from "react";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";

import { Category } from "@/types/category";
import { PomodoroStage, PomodoroStageMap } from "@/types/pomodoro";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons/icons";
import { usePomodoroStore } from "@/stores/pomodoro.store";
import { useSoundscapesStore } from "@/stores/soundscapes.store";
import { getTime } from "@/utils/timer.utils";

import { TimerStageButton } from "./timer/timer-stage-button";
import { TimerStats } from "./timer/timer-stats";

export const TimerDynamicIsland = () => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  useEffect(() => {
    loadTodayStats();
  }, []);

  useEffect(() => {
    if (timer.remaining === 0) {
      completeSession();
    }
  }, [timer.remaining, completeSession]);

  const handleToggle = () => {
    if (timer.running) {
      pauseTimer();
      pausePlayingSounds();
    } else if (timer.remaining === timer.stageSeconds[timer.activeStage]) {
      startTimer();
      playCategory(Category.BeautifulAmbients);
    } else {
      resumeTimer();
      playCategory(Category.BeautifulAmbients);
    }
  };

  const handleReset = () => {
    changeStage(PomodoroStage.WorkTime);
  };

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (timer.remaining === 0) {
      pausePlayingSounds();
    }
  }, [timer.remaining, pausePlayingSounds]);

  return (
    <motion.div className="absolute left-1/2 -translate-x-1/2 top-1 w-full max-w-sm z-10">
      <AnimatePresence mode="wait">
        <motion.div
          ref={containerRef}
          className="bg-white dark:bg-black backdrop-blur-xl overflow-hidden rounded-3xl min-w-60"
          layout
          initial={{
            borderRadius: isExpanded ? "28px" : "24px",
            width: "100%",
          }}
          animate={{
            borderRadius: isExpanded ? "24px" : "28px",
            width: "95%",
          }}
          exit={{
            borderRadius: isExpanded ? "28px" : "24px",
            width: "100%",
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 30,
            duration: 1,
          }}
        >
          {/* Main Status Bar */}
          <motion.div
            className="p-3 flex items-center justify-between cursor-pointer"
            layout="position"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isBreak ? "break" : "focus"}
                className="w-8 h-8 flex items-center justify-center text-2xl"
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

            <motion.div className="flex-1 mx-3" layout="position">
              <AnimatePresence mode="wait">
                <motion.p
                  key={isBreak ? "break" : "focus"}
                  className="text-black dark:text-white text-lg sm:text-2xl font-bold"
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
            </motion.div>
            <PomodoroControls
              isRunning={timer.running}
              onToggle={handleToggle}
              onReset={handleReset}
              percentage={getPercentage()}
            />
          </motion.div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && <TimerExpandedContent />}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
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
      className="relative w-12 h-12"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <svg className="w-full h-full transform -rotate-90">
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
    <div className="flex justify-center items-center gap-3">
      <AnimatePresence mode="wait">
        <motion.p
          key={isBreak ? "break" : "focus"}
          className="text-black/90 dark:text-white/90 text-xs uppercase"
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
      </AnimatePresence>

      <div className="flex items-center justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center p-2 rounded-full bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
        >
          <Icons.close className="w-4 h-4" />
        </motion.button>
      </div>

      <div
        className={cn("flex items-center justify-center", {
          "text-green-500 dark:text-green-500": isBreak,
          "text-blue-500 dark:text-blue-500": !isBreak,
        })}
      >
        <BatteryCircle percentage={percentage}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center p-1 rounded-full text-black dark:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isRunning ? (
              <Icons.pause className="size-4" />
            ) : (
              <Icons.play className="size-4 ml-0.5" />
            )}
          </motion.button>
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
    <div className="flex items-center gap-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl p-3">
      <div className="flex gap-2">
        {Array(longBreakInterval)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="size-5 flex items-center justify-center"
            >
              {index < currentIntervalSessions ||
              activeStage === PomodoroStage.LongBreak ? (
                <Icons.checkFilled className="text-green-500 size-5" />
              ) : (
                <div className="size-4 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              )}
            </div>
          ))}
      </div>
      <div className="flex items-center gap-1 ml-auto">
        🔥
        <span className="text-sm font-medium ml-1">{completedIntervals}</span>
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
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="p-3 pt-0">
        <motion.div
          className="border-t border-gray-200 dark:border-gray-700 pt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <SessionIndicators
            sessionCount={timer.sessionCount}
            longBreakInterval={timer.longBreakInterval}
            activeStage={timer.activeStage}
          />

          <div className="mt-3 grid grid-cols-3 gap-3">
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
        </motion.div>
      </div>
    </motion.div>
  );
});
