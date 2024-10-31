import { memo, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { Category } from "@/types/category";
import { PomodoroStage, PomodoroStageMap } from "@/types/pomodoro";
import { Icons } from "@/components/icons/icons";
import { usePomodoroStore } from "@/stores/pomodoro.store";
import { useSoundscapesStore } from "@/stores/soundscapes.store";
import { getTime } from "@/utils/timer.utils";

import { TimerStats } from "./timer/timer-stats";

const BatteryCircle = (props: {
  percentage: number;
  color?: string;
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
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-700"
        />
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          stroke={props.color}
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
  color,
  isRunning,
  onToggle,
  onReset,
}: {
  percentage: number;
  color: string;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}) => {
  return (
    <div className="flex justify-center gap-3">
      <div className="flex items-center justify-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center p-2 rounded-full bg-gray-700 text-orange-300"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
        >
          <Icons.history className="w-4 h-4" />
        </motion.button>
      </div>

      <BatteryCircle percentage={percentage} color={color}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute inset-0 flex items-center justify-center p-1 rounded-full text-white"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isRunning ? (
            <Icons.pause className="w-3 h-3" />
          ) : (
            <Icons.play className="w-3 h-3" />
          )}
        </motion.button>
      </BatteryCircle>
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
    <div className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-3">
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
                <div className="size-4 rounded-full bg-zinc-300" />
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
  const { timer } = usePomodoroStore((state) => ({
    timer: state.timer,
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
          className="border-t border-gray-700 pt-3"
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
            <motion.div
              className="bg-gray-800/50 rounded-xl p-3"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-white text-sm font-medium mb-1">Focus</h3>
              <p className="text-[#FF453A] text-base font-bold">
                {Math.floor(timer.stageSeconds[PomodoroStage.WorkTime] / 60)}m
              </p>
            </motion.div>

            <motion.div
              className="bg-gray-800/50 rounded-xl p-3"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-white text-sm font-medium mb-1">Break</h3>
              <p className="text-[#4CD964] text-base font-bold">
                {Math.floor(timer.stageSeconds[PomodoroStage.ShortBreak] / 60)}m
              </p>
            </motion.div>

            <motion.div
              className="bg-gray-800/50 rounded-xl p-3"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-white text-sm font-medium mb-1">
                Long Break
              </h3>
              <p className="text-[#4CD964] text-base font-bold">
                {Math.floor(timer.stageSeconds[PomodoroStage.LongBreak] / 60)}m
              </p>
            </motion.div>
          </div>

          <TimerStats />
        </motion.div>
      </div>
    </motion.div>
  );
});

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
  const timeString = `${minutesTens}${minutesUnit}:${secondsTens}${secondsUnit}`;

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
          className="bg-black/80 backdrop-blur-xl overflow-hidden rounded-3xl min-w-60"
          layout
          initial={{
            borderRadius: isExpanded ? "40px" : "24px",
            width: "100%",
          }}
          animate={{
            borderRadius: isExpanded ? "24px" : "40px",
            width: "95%",
          }}
          exit={{
            borderRadius: isExpanded ? "40px" : "24px",
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
                whileHover={{ scale: 1.1 }}
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
                  className="text-gray-400 text-[10px] tracking-tight uppercase"
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
              <AnimatePresence mode="wait">
                <motion.p
                  key={isBreak ? "break" : "focus"}
                  className="text-white text-base font-semibold"
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
                  {timeString}
                </motion.p>
              </AnimatePresence>
            </motion.div>
            <PomodoroControls
              isRunning={timer.running}
              onToggle={handleToggle}
              onReset={handleReset}
              percentage={getPercentage()}
              color={isBreak ? "#4CD964" : "#FF453A"}
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
