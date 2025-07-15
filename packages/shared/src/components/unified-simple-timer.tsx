import { useEffect, useState } from "react";
import { useUnifiedTimerStore } from "../stores/unified-simple-timer.store";
import { useDocumentTitle, useDisclosure } from "../hooks";
import {
  TimerStage,
  TimerEvent,
  TimerDurations,
} from "../types/new/pomodoro-lite";
import { formatTime } from "../utils/timer.utils";
import { Icons } from "./icons";
import { NextPinnedTask } from "./core/timer/components/next-pinned-task";
import { TimerStatsDialog } from "./core/timer/dialog/timer-stats.dialog";
import { UnifiedTimerSettings } from "./unified-timer-settings";
import { getTimerPlatform } from "../lib/timer-platform";

interface DurationValues {
  focusMin: number;
  breakMin: number;
}

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
    // Only handle Chrome extension messages here
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      return;
    }
    
    const handler = (msg: TimerEvent) => {
      switch (msg.type) {
        case "TICK":
          updateRemaining(msg.remaining);
          break;
        case "STAGE_COMPLETE":
          completeStage();
          if (!getLimitStatus().isLimitReached) start();
          break;
        case "PAUSED":
          updateRemaining(msg.remaining);
          break;
        case "RESET_COMPLETE":
          updateRemaining(durations[stage]);
          break;
      }
    };
    
    chrome.runtime.onMessage.addListener(handler);
    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
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
  onSettingsChange: (settings: {
    durations: { focusMin: number; breakMin: number };
    notifications: boolean;
    sounds: boolean;
  }) => void;
  onStatsClick: () => void;
  notifications: boolean;
  sounds: boolean;
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
  onSettingsChange,
  onStatsClick,
  notifications,
  sounds,
}: TimerViewProps) => {
  const [showDurationEditor, setShowDurationEditor] = useState(false);

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
            <div className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-normal">
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
                onClick={() => setShowDurationEditor(!showDurationEditor)}
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

            {/* Settings Panel (when settings clicked) */}
            {showDurationEditor && (
              <UnifiedTimerSettings
                focusMin={durations[TimerStage.Focus] / 60}
                breakMin={durations[TimerStage.Break] / 60}
                notifications={notifications}
                sounds={sounds}
                onSave={(values) => {
                  onSettingsChange(values);
                  setShowDurationEditor(false);
                }}
                onCancel={() => setShowDurationEditor(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Unified Pomodoro timer widget that works across extension and web.
 */
const useSimpleTimerState = () => {
  const timerStore = useUnifiedTimerStore();
  const statsModal = useDisclosure();
  const settingsModal = useDisclosure();

  const store = timerStore();
  
  const remaining = timerStore((s) => {
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
  });

  useRestoreTimer(store.restore);
  useDocumentTitle({ remaining, stage: store.stage, running: store.isRunning });
  useBackgroundMessages(
    store.stage,
    store.durations,
    store.updateRemaining,
    (store as any).completeStage,
    store.start,
    store.getLimitStatus
  );

  useEffect(() => {
    store.checkDailyReset?.();
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

export const UnifiedSimpleTimer = () => {
  const {
    store,
    remaining,
    limit,
    handleSettingsChange,
    statsModal,
    notifications,
    sounds,
  } = useSimpleTimerState();
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
        onSettingsChange={handleSettingsChange}
        onStatsClick={statsModal.open}
        notifications={notifications}
        sounds={sounds}
      />

      <TimerStatsDialog
        isOpen={statsModal.isOpen}
        onOpenChange={(open) => (open ? statsModal.open() : statsModal.close())}
      />
    </>
  );
};