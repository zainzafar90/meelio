import { useEffect, useState } from "react";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";

import { Category } from "../../../types";
import { cn } from "../../../lib";
import { useSoundscapesStore } from "../../../stores/soundscapes.store";
import { getTime } from "../../../utils/timer.utils";

import { TimerControls } from "./components/timer-controls";
import { TimerSettingsDialog } from "./dialog/timer-settings.dialog";
import { TimerStatsDialog } from "./dialog/timer-stats.dialog";

// Import worker directly
// @ts-ignore
import TimerWorker from "../../../workers/web-timer.worker?worker";

type TimerMode = "focus" | "short-break" | "long-break";

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  mode: TimerMode;
  cycleCount: number;
}

const STORAGE_KEY = "meelio:timer-state";
const ACTIVE_TAB_KEY = "meelio:timer-active-tab";

// Helper to format time for title
function formatTimeForTitle(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Helper to get duration for mode
function getDurationForMode(mode: TimerMode): number {
  switch (mode) {
    case "focus":
      return 25 * 60;
    case "short-break":
      return 5 * 60;
    case "long-break":
      return 15 * 60;
  }
}

// Create worker lazily
let worker: Worker | null = null;

export const Timer = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: 25 * 60,
    isRunning: false,
    mode: "focus",
    cycleCount: 1,
  });

  const { playCategory, pausePlayingSounds } = useSoundscapesStore((state) => ({
    playCategory: state.playCategory,
    pausePlayingSounds: state.pausePlayingSounds,
  }));

  // Initialize worker and set up listeners
  useEffect(() => {
    console.log("[Timer Component] Setting up worker");

    // Create worker if it doesn't exist
    if (!worker) {
      worker = new TimerWorker();
    }

    // Set up worker message handler
    const handleMessage = (e: MessageEvent) => {
      console.log("[Timer Component] Received message from worker:", e.data);

      switch (e.data.type) {
        case "STATE_UPDATE":
          console.log("[Timer Component] Updating state:", e.data.state);
          setTimerState(e.data.state);
          break;

        case "SAVE_STATE":
          console.log("[Timer Component] Saving state:", e.data.state);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(e.data.state));
          } catch (error) {
            console.error("[Timer] Error saving state:", error);
          }
          break;

        case "GET_SAVED_STATE":
          console.log("[Timer Component] Worker requested saved state");
          try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
              const parsedState = JSON.parse(savedState);
              worker?.postMessage({
                type: "LOAD_SAVED_STATE",
                state: parsedState,
              });
            }
          } catch (error) {
            console.error("[Timer] Error loading saved state:", error);
          }
          break;
      }
    };

    worker.addEventListener("message", handleMessage);

    // Handle storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          worker?.postMessage({ type: "SYNC_STATE", state: newState });
        } catch (error) {
          console.error("[Timer] Error processing storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    // Load initial state from storage and send to worker
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        worker.postMessage({ type: "LOAD_SAVED_STATE", state: parsedState });
      }
    } catch (error) {
      console.error("[Timer] Error loading initial state:", error);
    }

    // Update active tab timestamp
    const updateActiveTab = () => {
      localStorage.setItem(ACTIVE_TAB_KEY, Date.now().toString());
    };

    // Set initial active timestamp
    updateActiveTab();

    // Set up interval to update active timestamp
    const activeInterval = setInterval(updateActiveTab, 1000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(activeInterval);
      } else {
        updateActiveTab();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      console.log("[Timer Component] Cleaning up worker");
      worker?.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(activeInterval);
    };
  }, []);

  // Update document title when timer state changes
  useEffect(() => {
    const time = formatTimeForTitle(timerState.timeLeft);
    const mode =
      timerState.mode === "focus"
        ? "Focus"
        : timerState.mode === "short-break"
          ? "Break"
          : "Long Break";
    const icon = timerState.mode === "focus" ? "🎯" : "☕️";
    document.title = `${time} - ${mode} ${icon}`;
  }, [timerState]);

  const isBreak = timerState.mode !== "focus";

  const [minutesTens, minutesUnit, secondsTens, secondsUnit] = getTime(
    timerState.timeLeft
  );

  const getPercentage = () => {
    const getDuration = (mode: TimerMode) => {
      switch (mode) {
        case "focus":
          return 25 * 60;
        case "short-break":
          return 5 * 60;
        case "long-break":
          return 15 * 60;
      }
    };
    return (timerState.timeLeft / getDuration(timerState.mode)) * 100;
  };

  const handleToggle = () => {
    if (!worker) return;

    console.log("[Timer Component] Toggle clicked, current state:", timerState);
    if (timerState.isRunning) {
      console.log("[Timer Component] Pausing timer");
      worker.postMessage({ type: "PAUSE_TIMER" });
      pausePlayingSounds();
    } else {
      console.log("[Timer Component] Starting timer");
      worker.postMessage({ type: "START_TIMER" });
      if (timerState.mode === "focus") {
        playCategory(Category.BeautifulAmbients);
      }
    }
  };

  const handleReset = () => {
    if (!worker) return;

    console.log("[Timer Component] Resetting timer");
    worker.postMessage({ type: "RESET_TIMER" });
    pausePlayingSounds();
  };

  useEffect(() => {
    pausePlayingSounds();

    if (timerState.isRunning && timerState.mode === "focus") {
      playCategory(Category.BeautifulAmbients);
    }
  }, [timerState.mode, timerState.isRunning, pausePlayingSounds, playCategory]);

  return (
    <motion.div className="absolute left-1/2 top-8 z-10 w-full max-w-sm -translate-x-1/2">
      <AnimatePresence mode="wait">
        <motion.div
          layout
          className="min-w-60 rounded-xl bg-white backdrop-blur-xl dark:bg-black/80"
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
                    trend={"decreasing" as any}
                  />
                  <NumberFlow
                    value={minutesUnit}
                    format={{ notation: "compact" }}
                    locales="en-US"
                    trend={"decreasing" as any}
                  />
                  :
                  <NumberFlow
                    value={secondsTens}
                    format={{ notation: "compact" }}
                    locales="en-US"
                    trend={"decreasing" as any}
                  />
                  <NumberFlow
                    value={secondsUnit}
                    format={{ notation: "compact" }}
                    locales="en-US"
                    trend={"decreasing" as any}
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
                {timerState.mode === "focus"
                  ? "Focus Time"
                  : timerState.mode === "short-break"
                    ? "Short Break"
                    : "Long Break"}
              </motion.p>
            </motion.div>
            <TimerControls
              isRunning={timerState.isRunning}
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
