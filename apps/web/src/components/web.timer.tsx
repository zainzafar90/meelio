import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useWebTimerStore, webTimerPlatform } from "../stores/web.timer.store";
import { useDocumentTitle, useDisclosure } from "@repo/shared";
import {
  TimerStage,
  TimerDurations,
} from "@repo/shared";
import { formatTime } from "@repo/shared";
import { Icons } from "@repo/shared";
import { NextPinnedTask } from "@repo/shared";
import { TimerStatsDialog } from "@repo/shared";
import { TimerSettingsDialog } from "@repo/shared";


const useRestoreTimer = (restore: () => void) => {
  useEffect(() => {
    restore();
  }, [restore]);
};

const useBackgroundMessages = (
  stage: TimerStage,
  durations: TimerDurations,
  updateRemaining: (n: number) => void,
  completeStage: () => void,
  start: () => void,
  getLimitStatus: () => { isLimitReached: boolean }
) => {
  useEffect(() => {
    // Listen to web worker messages through the platform
    const cleanup = webTimerPlatform.onMessage((msg: { type: string; remaining?: number }) => {
      switch (msg.type) {
        case "TICK":
          updateRemaining(msg.remaining || 0);
          break;
        case "STAGE_COMPLETE":
          completeStage();
          if (!getLimitStatus().isLimitReached) start();
          break;
        case "PAUSED":
          // Worker paused, remaining is in msg.remaining
          break;
        case "RESET_COMPLETE":
          // Worker reset complete
          updateRemaining(durations[stage]);
          break;
      }
    });
    
    return cleanup;
  }, [stage, durations, updateRemaining, completeStage, start, getLimitStatus]);
};

interface TimerViewProps {
  remaining: number;
  running: boolean;
  stage: TimerStage;
  durations: TimerDurations;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: (s: TimerStage) => void;
  limitReached: boolean;
  onStatsClick: () => void;
  onSettingsClick: () => void;
}

const TimerView = ({
  remaining,
  running,
  stage,
  durations,
  start,
  pause,
  reset,
  skip,
  limitReached,
  onStatsClick,
  onSettingsClick,
}: TimerViewProps) => {

  return (
    <div className="relative">
      <div className="max-w-full w-72 sm:w-[400px] backdrop-blur-xl bg-white/5 rounded-3xl shadow-lg text-white">
        <div className="p-3 sm:p-6 space-y-10">
          {/* Timer Mode Tabs */}
          <div className="w-full">
            <div className="w-full h-12 rounded-full bg-gray-100/10 text-black p-1 flex">
              <button
                onClick={() => skip(TimerStage.Focus)}
                disabled={limitReached && stage !== TimerStage.Focus}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                  stage === TimerStage.Focus ? "bg-white/50" : ""
                } ${
                  limitReached && stage !== TimerStage.Focus
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                title={
                  limitReached && stage !== TimerStage.Focus
                    ? "Daily limit reached"
                    : "Focus mode"
                }
              >
                <span>Focus</span>
              </button>
              <button
                onClick={() => skip(TimerStage.Break)}
                disabled={stage === TimerStage.Break}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                  stage === TimerStage.Break ? "bg-white/50" : ""
                } ${
                  stage === TimerStage.Break
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                title="Break mode"
              >
                <span>Break</span>
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="font-bold tracking-normal overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}>
              {formatTime(remaining)}
            </div>
            <NextPinnedTask />
          </div>

          <div className="flex flex-col gap-4">
            {/* Control Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                className={`cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm ${
                  limitReached ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => !limitReached && reset()}
                disabled={limitReached}
                title={limitReached ? "Daily limit reached" : "Reset"}
                role="button"
              >
                <Icons.resetTimer className="size-4 text-white/90" />
                <span className="sr-only">Reset</span>
              </button>

              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                onClick={onStatsClick}
                title="View stats"
                role="button"
              >
                <Icons.graph className="size-4 text-white/90" />
                <span className="sr-only">Stats</span>
              </button>

              <button
                className={`cursor-pointer relative flex h-10 min-w-10 w-full items-center justify-center rounded-full shadow-lg bg-gradient-to-b from-zinc-800 to-zinc-900 text-white/90 backdrop-blur-sm ${
                  limitReached ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => {
                  if (limitReached) return;
                  if (running) {
                    pause();
                  } else {
                    start();
                  }
                }}
                disabled={limitReached}
                title={
                  limitReached
                    ? "Daily limit reached"
                    : running
                      ? "Pause"
                      : "Start"
                }
                role="button"
              >
                {running ? (
                  <Icons.pause className="size-4" />
                ) : (
                  <Icons.play className="size-4" />
                )}
                <span className="ml-2 uppercase text-xs sm:text-sm md:text-base hidden sm:block">
                  {running ? "Pause" : "Start"}
                </span>
              </button>

              <button
                className={`cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm ${
                  limitReached ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => {
                  if (limitReached) return;
                  skip(
                    stage === TimerStage.Focus
                      ? TimerStage.Break
                      : TimerStage.Focus
                  );
                }}
                disabled={limitReached}
                title={
                  limitReached ? "Daily limit reached" : "Skip to next stage"
                }
                role="button"
              >
                <Icons.forward className="size-4 text-white/90" />
                <span className="sr-only">Skip stage</span>
              </button>

              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                onClick={onSettingsClick}
                title="Settings"
                role="button"
              >
                <Icons.settings className="size-4 text-white/90" />
                <span className="sr-only">Settings</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-200/20 rounded-full">
              <div
                className="h-full bg-gray-100 rounded-full transition-all"
                style={{
                  width: `${(remaining / durations[stage]) * 100}%`,
                }}
                role="progressbar"
                aria-valuenow={(remaining / durations[stage]) * 100}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};


const useTimerState = () => {
  const statsModal = useDisclosure();
  const settingsModal = useDisclosure();

  const store = useWebTimerStore(
    useShallow((state) => ({
      stage: state.stage,
      isRunning: state.isRunning,
      durations: state.durations,
      settings: state.settings,
      start: state.start,
      pause: state.pause,
      reset: state.reset,
      skipToStage: state.skipToStage,
      updateDurations: state.updateDurations,
      toggleNotifications: state.toggleNotifications,
      toggleSounds: state.toggleSounds,
      updateRemaining: state.updateRemaining,
      getLimitStatus: state.getLimitStatus,
      restore: state.restore,
      completeStage: state.completeStage,
      checkDailyReset: state.checkDailyReset,
    }))
  );

  const remaining = useWebTimerStore(
    useShallow((s) => {
      // When paused, use the stored remaining time
      if (!s.isRunning && s.prevRemaining !== null) {
        return s.prevRemaining;
      }
      // When running with endTimestamp, calculate remaining
      if (s.endTimestamp) {
        return Math.max(0, Math.ceil((s.endTimestamp - Date.now()) / 1000));
      }
      // Default to stage duration
      return s.durations[s.stage];
    })
  );

  useRestoreTimer(store.restore);
  useDocumentTitle({ remaining, stage: store.stage, running: store.isRunning });
  useBackgroundMessages(
    store.stage,
    store.durations,
    store.updateRemaining,
    store.completeStage,
    store.start,
    store.getLimitStatus
  );

  useEffect(() => {
    // Call checkDailyReset once on component mount
    const checkDailyReset = useWebTimerStore.getState().checkDailyReset;
    checkDailyReset?.();
  }, []);

  const limit = store.getLimitStatus();

  const handleSettingsChange = (settings: {
    durations: { focusMin: number; breakMin: number };
    notifications: boolean;
    sounds: boolean;
  }) => {
    // Update durations
    store.updateDurations({ 
      focus: settings.durations.focusMin * 60, 
      break: settings.durations.breakMin * 60 
    });
    
    // Update notifications and sounds
    if (settings.notifications !== store.settings.notifications) {
      store.toggleNotifications();
    }
    if (settings.sounds !== store.settings.sounds) {
      store.toggleSounds();
    }
  };

  return {
    store,
    remaining,
    limit,
    handleSettingsChange,
    statsModal,
    settingsModal,
    notifications: store.settings.notifications,
    sounds: store.settings.sounds,
  };
};

export const WebTimer = () => {
  const {
    store,
    remaining,
    limit,
    handleSettingsChange,
    statsModal,
    settingsModal,
    notifications,
    sounds,
  } = useTimerState();
  return (
    <>
      <TimerView
        remaining={remaining}
        running={store.isRunning}
        stage={store.stage}
        durations={store.durations}
        start={store.start}
        pause={store.pause}
        reset={store.reset}
        skip={store.skipToStage}
        limitReached={limit.isLimitReached}
        onStatsClick={statsModal.open}
        onSettingsClick={settingsModal.open}
      />

      <TimerStatsDialog
        isOpen={statsModal.isOpen}
        onOpenChange={(open) => (open ? statsModal.open() : statsModal.close())}
      />

      <TimerSettingsDialog
        isOpen={settingsModal.isOpen}
        onOpenChange={(open) => (open ? settingsModal.open() : settingsModal.close())}
        focusMin={store.durations[TimerStage.Focus] / 60}
        breakMin={store.durations[TimerStage.Break] / 60}
        notifications={notifications}
        sounds={sounds}
        onSave={handleSettingsChange}
      />
    </>
  );
};