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
  type TimerEvent,
  type TimerMessage,
  type TimerRuntimeAdapter,
  type TimerSettings,
  type TimerSnapshot,
} from "@repo/timer-core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { pomodoroSounds } from "../../../../packages/shared/src/data/sounds-data";
import {
  addSimpleTimerBreakTime,
  addSimpleTimerFocusTime,
} from "../../../../packages/shared/src/lib/db/pomodoro.dexie";
import { soundSyncService } from "../../../../packages/shared/src/services/sound-sync.service";
import { timerEvents } from "../../../../packages/shared/src/utils/timer-events";
import TimerWorker from "../workers/timer-worker?worker";

interface WebTimerStoreState extends TimerSnapshot {
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

const getTodayKey = (): string => new Date().toISOString().split("T")[0]!;

const pickTimerSnapshot = (
  state: WebTimerStoreState
): TimerSnapshot => ({
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

class WebTimerRuntime implements TimerRuntimeAdapter {
  private worker: Worker | null = null;

  private listeners: Set<(message: TimerEvent) => void> = new Set();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    this.worker = new TimerWorker();
    this.worker.onmessage = (event: MessageEvent<TimerEvent>) => {
      this.listeners.forEach((listener) => listener(event.data));
    };
  }

  sendMessage(message: TimerMessage): void {
    if (message.type === "START" || message.type === "UPDATE_DURATION") {
      this.worker?.postMessage({
        type: message.type,
        payload: { duration: message.duration },
      });
      return;
    }

    this.worker?.postMessage({ type: message.type });
  }

  subscribe(callback: (message: TimerEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  showNotification(title: string, message: string): void {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body: message });
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    return (await Notification.requestPermission()) === "granted";
  }
}

export const webTimerRuntime = new WebTimerRuntime();

export const webTimerStore = create<WebTimerStoreState>()(
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

        webTimerRuntime.showNotification(title, body);
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
        const next = startTimer(current, Date.now());
        const duration = next.prevRemaining ?? next.durations[next.stage];

        webTimerRuntime.sendMessage({
          type: "START",
          duration,
          stage: next.stage,
        });
        set(next);
        emitTimerStart(next, duration);
      };

      const pause = () => {
        const current = pickTimerSnapshot(get());
        const next = pauseTimer(current, Date.now());

        webTimerRuntime.sendMessage({ type: "PAUSE" });
        set(next);
        emitTimerPause(current, next.prevRemaining);
      };

      const reset = () => {
        const current = pickTimerSnapshot(get());
        const next = resetTimer(current);

        webTimerRuntime.sendMessage({
          type: "RESET",
          stage: TimerStage.Focus,
        });
        set(next);
        emitTimerReset(current);
      };

      const skipToStage = (stage: TimerStage) => {
        const next = skipToTimerStage(pickTimerSnapshot(get()), stage);

        webTimerRuntime.sendMessage({
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
          webTimerRuntime.sendMessage({
            type: "UPDATE_DURATION",
            duration: durations[activeStageKey]!,
          });
        }

        emitDurationUpdate(next, durations);
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
        updateRemaining: (remaining: number) =>
          set((state) => updateTimerRemaining(pickTimerSnapshot(state), remaining)),
        restore: () => {
          checkDailyReset();

          const current = pickTimerSnapshot(get());
          if (!current.isRunning || current.endTimestamp === null) {
            return;
          }

          const left = Math.max(
            0,
            Math.ceil((current.endTimestamp - Date.now()) / 1000)
          );

          if (left <= 0) {
            set({
              isRunning: false,
              endTimestamp: null,
            });
            webTimerRuntime.sendMessage({
              type: "RESET",
              stage: TimerStage.Focus,
            });
            return;
          }

          webTimerRuntime.sendMessage({
            type: "START",
            duration: left,
            stage: current.stage,
          });
          set(restoreTimer(current, Date.now()));
        },
        completeStage,
        checkDailyReset,
        playCompletionSound: () =>
          playCompletionSound(get().settings.sounds, get().settings.soundId).catch(
            console.error
          ),
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
