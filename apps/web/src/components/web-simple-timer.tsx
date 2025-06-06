import { useEffect, useState } from "react";
import { useDocumentTitle, useDisclosure } from "@repo/shared";
import {
  TimerStage,
  TimerDurations,
  formatTime,
  Icons,
  NextPinnedTask,
  TimerStatsDialog,
} from "@repo/shared";
import { useWebTimerStore, getWebTimerWorker } from "../stores/web-timer.store";

interface DurationValues {
  focusMin: number;
  breakMin: number;
}

interface SettingsPanelProps extends DurationValues {
  onSave: (v: DurationValues) => void;
  notifications: boolean;
  sounds: boolean;
  onToggleNotifications: () => void;
  onToggleSounds: () => void;
}

const SettingsPanel = ({
  focusMin,
  breakMin,
  onSave,
  notifications,
  sounds,
  onToggleNotifications,
  onToggleSounds,
}: SettingsPanelProps) => {
  const [focus, setFocus] = useState(focusMin);
  const [brk, setBreak] = useState(breakMin);

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 space-y-4">
      {/* Duration Settings */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">
          Timer Duration
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">
              Focus (min)
            </label>
            <input
              type="number"
              className="w-full bg-white/10 backdrop-blur rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
              value={focus}
              min={1}
              max={90}
              onChange={(e) => setFocus(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">
              Break (min)
            </label>
            <input
              type="number"
              className="w-full bg-white/10 backdrop-blur rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-white/20"
              value={brk}
              min={1}
              max={30}
              onChange={(e) => setBreak(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Notification & Sound Settings */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">
          Notifications & Sound
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Enable notifications</span>
            <button
              onClick={onToggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? "bg-white/30" : "bg-white/10"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Enable sounds</span>
            <button
              onClick={onToggleSounds}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                sounds ? "bg-white/30" : "bg-white/10"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  sounds ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => onSave({ focusMin: focus, breakMin: brk })}
        className="w-full bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-white text-sm font-medium hover:bg-white/30 transition-colors"
      >
        Save Duration Changes
      </button>
    </div>
  );
};

const useRestoreTimer = (restore: () => void) => {
  useEffect(() => {
    restore();
  }, [restore]);
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
  onDurations: (d: DurationValues) => void;
  onStatsClick: () => void;
  notifications: boolean;
  sounds: boolean;
  onToggleNotifications: () => void;
  onToggleSounds: () => void;
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
  onDurations,
  onStatsClick,
  notifications,
  sounds,
  onToggleNotifications,
  onToggleSounds,
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
              <SettingsPanel
                focusMin={durations[TimerStage.Focus] / 60}
                breakMin={durations[TimerStage.Break] / 60}
                notifications={notifications}
                sounds={sounds}
                onSave={(values) => {
                  onDurations(values);
                  setShowDurationEditor(false);
                }}
                onToggleNotifications={onToggleNotifications}
                onToggleSounds={onToggleSounds}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const useWebSimpleTimerState = () => {
  const store = useWebTimerStore();
  const statsModal = useDisclosure();

  const remaining = useWebTimerStore((s) => {
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

  // Set up web worker message handling
  useEffect(() => {
    const worker = getWebTimerWorker();
    
    const handleMessage = (event: MessageEvent) => {
      const { type, remaining } = event.data;
      
      switch (type) {
        case "TICK":
          store.updateRemaining(remaining);
          break;
        case "STAGE_COMPLETE":
          store.completeStage();
          if (!store.getLimitStatus().isLimitReached) {
            store.start();
          }
          break;
        case "PAUSED":
          store.updateRemaining(remaining);
          break;
        case "RESET_COMPLETE":
          store.updateRemaining(store.durations[store.stage]);
          break;
      }
    };

    worker.addMessageHandler(handleMessage);
    
    return () => {
      worker.removeMessageHandler(handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - setup once. Store is stable from Zustand

  useEffect(() => {
    store.checkDailyReset?.();
  }, [store]);

  const limit = store.getLimitStatus();

  const handleDurations = (d: DurationValues) => {
    store.updateDurations({ focus: d.focusMin * 60, break: d.breakMin * 60 });
  };

  return {
    store,
    remaining,
    limit,
    handleDurations,
    statsModal,
    notifications: store.settings.notifications,
    sounds: store.settings.sounds,
    toggleNotifications: store.toggleNotifications,
    toggleSounds: store.toggleSounds,
  };
};

/**
 * Web-specific SimpleTimer that uses web worker for background processing
 */
export const WebSimpleTimer = () => {
  const {
    store,
    remaining,
    limit,
    handleDurations,
    statsModal,
    notifications,
    sounds,
    toggleNotifications,
    toggleSounds,
  } = useWebSimpleTimerState();

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
        onDurations={handleDurations}
        onStatsClick={statsModal.open}
        notifications={notifications}
        sounds={sounds}
        onToggleNotifications={toggleNotifications}
        onToggleSounds={toggleSounds}
      />

      <TimerStatsDialog
        isOpen={statsModal.isOpen}
        onOpenChange={(open) => (open ? statsModal.open() : statsModal.close())}
      />
    </>
  );
};