import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { createTimerStore } from "../stores/timer.store";
import { useDocumentTitle, useDisclosure } from "../hooks";
import {
  TimerStage,
  TimerEvent,
  TimerDurations,
  TimerRuntimeAdapter,
} from "../types/timer.types";
import { formatTime } from "../utils/timer.utils";
import { Icons } from "./icons";
import { NextPinnedTask } from "./core/timer/components/timer-next-task";
import { TimerStatsDialog } from "./core/timer/dialog/timer-stats.dialog";
import { TimerSettingsDialog } from "./timer-settings.dialog";

const useRestoreTimer = (restore: () => void) => {
  useEffect(() => {
    restore();
  }, [restore]);
};

const useBackgroundMessages = (
  runtime: TimerRuntimeAdapter,
  stage: TimerStage,
  durations: TimerDurations,
  updateRemaining: (n: number) => void,
  completeStage: () => void,
  start: () => void,
  autoStartBreaks: boolean
) => {
  useEffect(() => {
    const unsubscribe = runtime.subscribe((msg: TimerEvent) => {
      switch (msg.type) {
        case "TICK":
          updateRemaining(msg.remaining);
          break;
        case "STAGE_COMPLETE":
          completeStage();
          if (autoStartBreaks) start();
          break;
        case "PAUSED":
          updateRemaining(msg.remaining);
          break;
        case "RESET_COMPLETE":
          updateRemaining(durations[stage]);
          break;
      }
    });

    return unsubscribe;
  }, [runtime, stage, durations, updateRemaining, completeStage, start, autoStartBreaks]);
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
  onStatsClick,
  onSettingsClick,
}: TimerViewProps) => {
  return (
    <div className="relative">
      <div className="max-w-full w-88 sm:w-[440px] lg:w-[540px] backdrop-blur-xl bg-white/5 rounded-3xl shadow-lg text-white">
        <div className="p-4 sm:p-8 space-y-12">
          <div className="w-full">
            <div className="w-full h-12 rounded-full bg-gray-100/10 text-black p-1 flex">
              <button
                onClick={() => skip(TimerStage.Focus)}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                  stage === TimerStage.Focus ? "bg-white/50" : ""
                }`}
                title="Focus mode"
              >
                <span>Focus</span>
              </button>
              <button
                onClick={() => skip(TimerStage.Break)}
                disabled={stage === TimerStage.Break}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                  stage === TimerStage.Break ? "bg-white/50" : ""
                } ${stage === TimerStage.Break ? "opacity-50 cursor-not-allowed" : ""}`}
                title="Break mode"
              >
                <span>Break</span>
              </button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-normal">
              {formatTime(remaining)}
            </div>
            <NextPinnedTask />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                onClick={reset}
                title="Reset"
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
                className="cursor-pointer relative flex h-10 min-w-10 w-full items-center justify-center rounded-full shadow-lg bg-gradient-to-b from-zinc-800 to-zinc-900 text-white/90 backdrop-blur-sm"
                onClick={() => running ? pause() : start()}
                title={running ? "Pause" : "Start"}
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
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                onClick={() => skip(stage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus)}
                title="Skip to next stage"
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

            <div className="h-1.5 bg-gray-200/20 rounded-full">
              <div
                className="h-full bg-gray-100 rounded-full transition-all"
                style={{ width: `${(remaining / durations[stage]) * 100}%` }}
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

type TimerStoreHook = ReturnType<typeof createTimerStore>;

const useTimerState = (
  timerStore: TimerStoreHook,
  runtime: TimerRuntimeAdapter
) => {
  const statsModal = useDisclosure();
  const settingsModal = useDisclosure();

  const store = timerStore(
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
      toggleSoundscapes: state.toggleSoundscapes,
      toggleAutoStartBreaks: state.toggleAutoStartBreaks,
      setSoundId: state.setSoundId,
      updateRemaining: state.updateRemaining,
      restore: state.restore,
      completeStage: state.completeStage,
      checkDailyReset: state.checkDailyReset,
    }))
  );

  const remaining = timerStore(
    useShallow((s) => {
      if (!s.isRunning && s.prevRemaining !== null) {
        return s.prevRemaining;
      }
      if (s.endTimestamp) {
        return Math.max(0, Math.ceil((s.endTimestamp - Date.now()) / 1000));
      }
      return s.durations[s.stage];
    })
  );

  useRestoreTimer(store.restore);
  useDocumentTitle({ remaining, stage: store.stage, running: store.isRunning });
  useBackgroundMessages(
    runtime,
    store.stage,
    store.durations,
    store.updateRemaining,
    store.completeStage,
    store.start,
    store.settings.autoStartBreaks ?? true
  );

  useEffect(() => {
    store.checkDailyReset?.();
  }, []);

  const handleSettingsChange = (settings: {
    durations: { focusMin: number; breakMin: number };
    notifications: boolean;
    sounds: boolean;
    soundId?: string;
    soundscapes?: boolean;
    autoStartBreaks?: boolean;
  }) => {
    store.updateDurations({
      focus: settings.durations.focusMin * 60,
      break: settings.durations.breakMin * 60
    });

    if (settings.notifications !== store.settings.notifications) {
      store.toggleNotifications();
    }
    if (settings.sounds !== store.settings.sounds) {
      store.toggleSounds();
    }
    if (settings.soundId !== undefined && settings.soundId !== store.settings.soundId) {
      store.setSoundId?.(settings.soundId);
    }
    if (typeof settings.soundscapes === 'boolean' && settings.soundscapes !== store.settings.soundscapes) {
      store.toggleSoundscapes?.();
    }
    if (typeof settings.autoStartBreaks === 'boolean' && settings.autoStartBreaks !== (store.settings.autoStartBreaks ?? true)) {
      store.toggleAutoStartBreaks?.();
    }
  };

  return {
    store,
    remaining,
    handleSettingsChange,
    statsModal,
    settingsModal,
    notifications: store.settings.notifications,
    sounds: store.settings.sounds,
    soundId: store.settings.soundId ?? "timeout-1-back-chime",
    soundscapes: store.settings.soundscapes ?? true,
    autoStartBreaks: store.settings.autoStartBreaks ?? true,
  };
};

interface TimerProps {
  timerStore: TimerStoreHook;
  runtime: TimerRuntimeAdapter;
}

export const Timer = ({ timerStore, runtime }: TimerProps) => {
  const {
    store,
    remaining,
    handleSettingsChange,
    statsModal,
    settingsModal,
    notifications,
    sounds,
    soundId,
    soundscapes,
    autoStartBreaks,
  } = useTimerState(timerStore, runtime);

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
        soundId={soundId}
        soundscapes={soundscapes}
        autoStartBreaks={autoStartBreaks}
        onSave={handleSettingsChange}
      />
    </>
  );
};
