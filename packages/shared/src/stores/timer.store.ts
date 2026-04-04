import {
  completeTimerStage,
  createInitialTimerSnapshot,
  pauseTimer,
  resetTimer,
  restoreTimer,
  skipToTimerStage,
  startTimer,
  updateTimerDurations,
  updateTimerRemaining,
  type TimerSnapshot,
} from "@repo/core/timer";
import type { TimerRuntimeAdapter, TimerSettings } from "@repo/contracts/timer";
import { TimerStage } from "@repo/contracts/timer";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { pomodoroSounds } from "../data";
import {
  addSimpleTimerBreakTime,
  addSimpleTimerFocusTime,
} from "../lib/db/pomodoro.dexie";
import { soundSyncService } from "../services/sound-sync.service";
import type { TimerState } from "../types/timer.types";
import { timerEvents } from "../utils/timer-events";

interface TimerStoreDeps {
  now: () => number;
  pushUsage: (seconds: number) => Promise<void>;
}

const TIMER_STORAGE_KEY = "meelio:simple-timer";
const TIMER_LAST_RESET_KEY = "meelio:simple-timer:lastReset";

const playCompletionSound = async (
  soundEnabled: boolean,
  soundId = "timeout-1-back-chime"
) => {
  if (!soundEnabled) {
    return;
  }

  try {
    const sound = pomodoroSounds.find((entry) => entry.id === soundId);
    if (!sound) {
      return;
    }

    const url = await soundSyncService.getSoundUrl(sound.url);
    const audio = new Audio(url);
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    console.error("Failed to play timer sound:", error);
  }
};

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

const emitTimerStart = (state: TimerSnapshot, duration: number) => {
  timerEvents.emit({
    type: "timer:start",
    stage: state.stage === TimerStage.Focus ? "focus" : "break",
    duration,
    remaining: duration,
    data: {
      soundscapesEnabled: state.settings.soundscapes ?? true,
    },
  });
};

const emitTimerPause = (state: TimerSnapshot, remaining: number | null) => {
  timerEvents.emit({
    type: "timer:pause",
    stage: state.stage === TimerStage.Focus ? "focus" : "break",
    remaining: remaining ?? undefined,
    data: {
      soundscapesEnabled: state.settings.soundscapes ?? true,
    },
  });
};

const emitTimerReset = (state: TimerSnapshot) => {
  timerEvents.emit({
    type: "timer:reset",
    stage: "focus",
    data: {
      soundscapesEnabled: state.settings.soundscapes ?? true,
    },
  });
};

const emitDurationUpdate = (
  state: TimerSnapshot,
  durations: Partial<{ focus: number; break: number }>
) => {
  timerEvents.emit({
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
  finishedStage: TimerStage,
  completedDuration: number,
  settings: TimerSettings
) => {
  const nextStage =
    finishedStage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus;

  timerEvents.emit({
    type: "timer:complete",
    stage: finishedStage === TimerStage.Focus ? "focus" : "break",
    duration: completedDuration,
    data: {
      nextStage: nextStage === TimerStage.Focus ? "focus" : "break",
      soundscapesEnabled: settings.soundscapes ?? true,
    },
  });

  timerEvents.emit({
    type: "timer:stage-change",
    stage: nextStage === TimerStage.Focus ? "focus" : "break",
    data: {
      soundscapesEnabled: settings.soundscapes ?? true,
    },
  });
};

const getTodayKey = (): string => new Date().toISOString().split("T")[0]!;

export const createTimerStore = (runtime: TimerRuntimeAdapter) => {
  const deps: TimerStoreDeps = {
    now: () => Date.now(),
    pushUsage: async () => Promise.resolve(),
  };

  return create<TimerState>()(
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
          const lastResetDate = localStorage.getItem(TIMER_LAST_RESET_KEY);

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

          localStorage.setItem(TIMER_LAST_RESET_KEY, todayKey);
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
          emitTimerStart(next, duration);
        };

        const pause = () => {
          const current = pickTimerSnapshot(get());
          const next = pauseTimer(current, deps.now());

          runtime.sendMessage({ type: "PAUSE" });
          set(next);
          emitTimerPause(current, next.prevRemaining);
        };

        const reset = () => {
          const current = pickTimerSnapshot(get());
          const next = resetTimer(current);

          runtime.sendMessage({
            type: "RESET",
            stage: TimerStage.Focus,
          });
          set(next);
          emitTimerReset(current);
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

          emitDurationUpdate(next, durations);
        };

        const updateRemainingAction = (remaining: number) => {
          const current = pickTimerSnapshot(get());
          const next = updateTimerRemaining(current, remaining);

          set(next);
          if (next.stage === TimerStage.Focus && next.unsyncedFocusSec >= 300) {
            void deps
              .pushUsage(next.unsyncedFocusSec)
              .then(() => set({ unsyncedFocusSec: 0 }))
              .catch((error: Error) => {
                console.error("sync usage failed", error);
              });
          }
        };

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
            set({ isRunning: false, endTimestamp: null });
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

          if (finishedStage === TimerStage.Focus) {
            addSimpleTimerFocusTime(completedDuration).catch((error) => {
              console.error("Failed to save focus time to database:", error);
            });
          } else {
            addSimpleTimerBreakTime(completedDuration).catch((error) => {
              console.error("Failed to save break time to database:", error);
            });
          }

          void playCompletionSound(
            current.settings.sounds,
            current.settings.soundId
          ).catch(console.error);
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
            playCompletionSound(get().settings.sounds, get().settings.soundId)
              .catch(console.error),
          showCompletionNotification: (stage: TimerStage) =>
            showCompletionNotification(stage, get().settings.notifications),
        };
      },
      {
        name: TIMER_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
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
};
