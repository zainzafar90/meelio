import { useEffect, useRef, useState } from "react";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";

import { Category } from "@/types/category";
import { PomodoroStage, PomodoroStageMap } from "@/types/pomodoro";
import { cn } from "@/lib/utils";
import { usePomodoroStore } from "@/stores/pomodoro.store";
import { useSoundscapesStore } from "@/stores/soundscapes.store";
import { getTime } from "@/utils/timer.utils";

import { TimerControls } from "./components/timer-controls";
import { TimerSettingsDialog } from "./dialog/timer-settings.dialog";
import { TimerStatsDialog } from "./dialog/timer-stats.dialog";

export const Timer = () => {
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
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

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

  return (
    <motion.div className="absolute left-1/2 top-8 z-10 w-full max-w-sm -translate-x-1/2">
      <AnimatePresence mode="wait">
        <motion.div
          ref={containerRef}
          layout
          className="min-w-60 rounded-xl bg-white backdrop-blur-xl dark:bg-black/80"
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
            className="flex cursor-pointer items-center justify-between p-3 "
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
            <TimerControls
              isRunning={timer.running}
              onToggle={handleToggle}
              onReset={handleReset}
              percentage={getPercentage()}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <TimerStatsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSettingsClick={() => setShowSettingsDialog(true)}
      />

      <TimerSettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </motion.div>
  );
};
