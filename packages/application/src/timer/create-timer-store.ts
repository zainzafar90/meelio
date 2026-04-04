import {
  TimerStage,
  completeTimerStage,
  createInitialTimerSnapshot,
  pauseTimer,
  resetTimer,
  restoreTimer,
  skipToTimerStage,
  startTimer,
  updateTimerDurations,
  updateTimerRemaining,
  type TimerRuntimeAdapter,
  type TimerSettings,
  type TimerSnapshot,
} from "@repo/timer-core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface TimerAppEvent {
  type:
    | "timer:start"
    | "timer:pause"
    | "timer:complete"
    | "timer:reset"
    | "timer:stage-change"
    | "timer:duration-update";
  stage?: "focus" | "break";
  duration?: number;
  remaining?: number;
  data?: Record<string, unknown>;
}

export interface TimerState extends TimerSnapshot {
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipToStage: (stage: TimerStage) => void;
  updateDurations: (
    durations: Partial<{ focus: number; break: number }>
  ) => void;
  toggleNotifications: () => void;
  toggleSounds: () => void;
  toggleSoundscapes: () => void;
  toggleAutoStartBreaks: () => void;
  setSoundId: (id: string) => void;
  updateRemaining: (remaining: number) => void;
  restore: () => void;
  completeStage: () => void;
  checkDailyReset: () => void;
  playCompletionSound: () => void;
  showCompletionNotification: (stage: TimerStage) => void;
}

export interface TimerStoreDeps {
  now: () => number;
  storage: Storage;
  playCompletionSound: (
    soundEnabled: boolean,
    soundId: string
  ) => Promise<void>;
  recordCompletedStage: (
    stage: TimerStage,
    duration: number
  ) => Promise<void>;
  emitEvent: (event: TimerAppEvent) => void;
}

const TIMER_STORAGE_KEY = "meelio:simple-timer";
const TIMER_LAST_RESET_KEY = "meelio:simple-timer:lastReset";

const pickTimerSnapshot = (state: TimerState): TimerSnapshot => ({
  stage: state.stage,
  isRunning: state.isRunning,
  endTimestamp: state.endTimestamp,
  durations: state.durations,
  settings: state.settings,
  stats: state.stats,
  unsyncedFocusSec: state.unsyncedFocusSec,
  prevRemaining: state.prevRemaining,
});

const emitTimerStart = (
  emitEvent: TimerStoreDeps["emitEvent"],
  state: TimerSnapshot,
  duration: number
) => {
  emitEvent({
    type: "timer:start",
    stage: state.stage === TimerStage.Focus ? "focus" : "break",
    duration,
    remaining: duration,
    data: {
      soundscapesEnabled: state.settings.soundscapes ?? true,
    },
  });
};

const emitTimerPause = (
  emitEvent: TimerStoreDeps["emitEvent"],
  state: TimerSnapshot,
  remaining: number | null
) => {
  emitEvent({
    type: "timer:pause",
    stage: state.stage === TimerStage.Focus ? "focus" : "break",
    remaining: remaining ?? undefined,
    data: {
      soundscapesEnabled: state.settings.soundscapes ?? true,
    },
  });
};

const emitTimerReset = (
  emitEvent: TimerStoreDeps["emitEvent"],
  state: TimerSnapshot
) => {
  emitEvent({
    type: "timer:reset",
    stage: "focus",
    data: {
      soundscapesEnabled: state.settings.soundscapes ?? true,
    },
  });
};

const emitDurationUpdate = (
  emitEvent: TimerStoreDeps["emitEvent"],
  state: TimerSnapshot,
  durations: Partial<{ focus: number; break: number }>
) => {
  emitEvent({
    type: "timer:duration-update",
    stage: state.stage === TimerStage.Focus ? "focus" : "break",
    duration:
      durations.focus ?? durations.break ?? state.durations[state.stage],
    data: {
      focus: durations.focus ?? state.durations[TimerStage.Focus],
      break: durations.break ?? state.durations[TimerStage.Break],
    },
  });
};

const emitTimerComplete = (
  emitEvent: TimerStoreDeps["emitEvent"],
  finishedStage: TimerStage,
  completedDuration: number,
  settings: TimerSettings
) => {
  const nextStage =
    finishedStage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus;

  emitEvent({
    type: "timer:complete",
    stage: finishedStage === TimerStage.Focus ? "focus" : "break",
    duration: completedDuration,
    data: {
      nextStage: nextStage === TimerStage.Focus ? "focus" : "break",
      soundscapesEnabled: settings.soundscapes ?? true,
    },
  });

  emitEvent({
    type: "timer:stage-change",
    stage: nextStage === TimerStage.Focus ? "focus" : "break",
    data: {
      soundscapesEnabled: settings.soundscapes ?? true,
    },
  });
};

const getTodayKey = (): string => new Date().toISOString().split("T")[0]!;

export const createTimerStore = (
  runtime: TimerRuntimeAdapter,
  deps: TimerStoreDeps
) =>
  create<TimerState>()(
    persist(
      (set, get) => {
        const showCompletionNotification = (
          stage: TimerStage,
          notificationsEnabled: boolean
        ) => {
          if (!notificationsEnabled) {
            return;
          }

          const title =
            stage === TimerStage.Focus
              ? "Focus session complete! 🎯"
              : "Break time is over! ☕";
          const body =
            stage === TimerStage.Focus
              ? "Great work! Time for a break."
              : "Ready to focus again?";

          runtime.showNotification(title, body);
        };

        const checkDailyReset = () => {
          const todayKey = getTodayKey();
          const lastResetDate = deps.storage.getItem(TIMER_LAST_RESET_KEY);

          if (lastResetDate === todayKey) {
            return;
          }

          set((state) => ({
            stats: {
              ...state.stats,
              focusSec: 0,
              breakSec: 0,
            },
          }));

          deps.storage.setItem(TIMER_LAST_RESET_KEY, todayKey);
        };

        const start = () => {
          checkDailyReset();

          const current = pickTimerSnapshot(get());
          const next = startTimer(current, deps.now());
          const duration = next.prevRemaining ?? next.durations[next.stage];

          runtime.sendMessage({
            type: "START",
            duration,
            stage: next.stage,
          });
          set(next);
          emitTimerStart(deps.emitEvent, next, duration);
        };

        const pause = () => {
          const current = pickTimerSnapshot(get());
          const next = pauseTimer(current, deps.now());

          runtime.sendMessage({ type: "PAUSE" });
          set(next);
          emitTimerPause(deps.emitEvent, current, next.prevRemaining);
        };

        const reset = () => {
          const current = pickTimerSnapshot(get());
          const next = resetTimer(current);

          runtime.sendMessage({
            type: "RESET",
            stage: TimerStage.Focus,
          });
          set(next);
          emitTimerReset(deps.emitEvent, current);
        };

        const skipToStage = (stage: TimerStage) => {
          const next = skipToTimerStage(pickTimerSnapshot(get()), stage);

          runtime.sendMessage({
            type: "SKIP_TO_NEXT_STAGE",
            nextStage: stage,
          });
          set(next);
        };

        const updateDurationsAction = (
          durations: Partial<{ focus: number; break: number }>
        ) => {
          const current = pickTimerSnapshot(get());
          const next = updateTimerDurations(current, durations);
          const activeStageKey =
            current.stage === TimerStage.Focus ? "focus" : "break";

          set(next);
          if (current.isRunning && durations[activeStageKey] !== undefined) {
            runtime.sendMessage({
              type: "UPDATE_DURATION",
              duration: durations[activeStageKey]!,
            });
          }

          emitDurationUpdate(deps.emitEvent, next, durations);
        };

        const updateRemainingAction = (remaining: number) =>
          set((state) => updateTimerRemaining(pickTimerSnapshot(state), remaining));

        const restore = () => {
          checkDailyReset();

          const current = pickTimerSnapshot(get());
          if (!current.isRunning || current.endTimestamp === null) {
            return;
          }

          const left = Math.max(
            0,
            Math.ceil((current.endTimestamp - deps.now()) / 1000)
          );

          if (left <= 0) {
            set({
              isRunning: false,
              endTimestamp: null,
            });
            runtime.sendMessage({
              type: "RESET",
              stage: TimerStage.Focus,
            });
            return;
          }

          runtime.sendMessage({
            type: "START",
            duration: left,
            stage: current.stage,
          });
          set(restoreTimer(current, deps.now()));
        };

        const completeStage = () => {
          const current = pickTimerSnapshot(get());
          const finishedStage = current.stage;
          const completedDuration = current.durations[finishedStage];
          const next = completeTimerStage(current, finishedStage);

          if (next === current) {
            return;
          }

          deps
            .recordCompletedStage(finishedStage, completedDuration)
            .catch((error) => {
              console.error("Failed to persist timer completion:", error);
            });

          void deps
            .playCompletionSound(current.settings.sounds, current.settings.soundId)
            .catch(console.error);
          showCompletionNotification(
            finishedStage,
            current.settings.notifications
          );

          set({
            stage: next.stage,
            isRunning: false,
            endTimestamp: null,
            prevRemaining: next.prevRemaining,
          });
          emitTimerComplete(
            deps.emitEvent,
            finishedStage,
            completedDuration,
            current.settings
          );
        };

        return {
          ...createInitialTimerSnapshot(),
          start,
          pause,
          reset,
          skipToStage,
          updateDurations: updateDurationsAction,
          toggleNotifications: () =>
            set((state) => ({
              settings: {
                ...state.settings,
                notifications: !state.settings.notifications,
              },
            })),
          toggleSounds: () =>
            set((state) => ({
              settings: {
                ...state.settings,
                sounds: !state.settings.sounds,
              },
            })),
          toggleSoundscapes: () =>
            set((state) => ({
              settings: {
                ...state.settings,
                soundscapes: !state.settings.soundscapes,
              },
            })),
          toggleAutoStartBreaks: () =>
            set((state) => ({
              settings: {
                ...state.settings,
                autoStartBreaks: !state.settings.autoStartBreaks,
              },
            })),
          setSoundId: (id: string) =>
            set((state) => ({
              settings: {
                ...state.settings,
                soundId: id,
              },
            })),
          updateRemaining: updateRemainingAction,
          restore,
          completeStage,
          checkDailyReset,
          playCompletionSound: () =>
            deps.playCompletionSound(get().settings.sounds, get().settings.soundId),
          showCompletionNotification: (stage: TimerStage) =>
            showCompletionNotification(stage, get().settings.notifications),
        };
      },
      {
        name: TIMER_STORAGE_KEY,
        storage: createJSONStorage(() => deps.storage),
        partialize: (state) => ({
          stage: state.stage,
          durations: state.durations,
          settings: state.settings,
          stats: state.stats,
          isRunning: state.isRunning,
          endTimestamp: state.endTimestamp,
          prevRemaining: state.prevRemaining,
        }),
      }
    )
  );
