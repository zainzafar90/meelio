import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { pomodoroSounds } from "../data";
import {
  TimerStage,
  TimerState,
  TimerDeps,
  TimerSettings,
  TimerRuntimeAdapter,
} from "../types/timer.types";
import {
  addSimpleTimerFocusTime,
  addSimpleTimerBreakTime,
} from "../lib/db/pomodoro.dexie";
import { timerEvents } from "../utils/timer-events";
import { soundSyncService } from "../services/sound-sync.service";

const playCompletionSound = async (
  soundEnabled: boolean,
  soundId: string = "timeout-1-back-chime"
) => {
  if (!soundEnabled) return;

  try {
    const sound = pomodoroSounds.find((s) => s.id === soundId);
    if (!sound) return;

    const url = await soundSyncService.getSoundUrl(sound.url);
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.error("Failed to play timer sound:", error);
    });
  } catch (error) {
    console.error("Error playing completion sound:", error);
  }
};

function initState(): Omit<
  TimerState,
  | keyof TimerDeps
  | "start"
  | "pause"
  | "reset"
  | "skipToStage"
  | "updateDurations"
  | "toggleNotifications"
  | "toggleSounds"
  | "toggleSoundscapes"
  | "toggleAutoStartBreaks"
  | "updateRemaining"
  | "restore"
  | "completeStage"
  | "checkDailyReset"
  | "playCompletionSound"
  | "showCompletionNotification"
> {
  return {
    stage: TimerStage.Focus,
    isRunning: false,
    endTimestamp: null,
    durations: { [TimerStage.Focus]: 25 * 60, [TimerStage.Break]: 5 * 60 },
    settings: { notifications: true, sounds: true, soundId: "timeout-1-back-chime", soundscapes: true, autoStartBreaks: true },
    stats: { focusSec: 0, breakSec: 0 },
    unsyncedFocusSec: 0,
    prevRemaining: null,
  };
}

export const createTimerStore = (runtime: TimerRuntimeAdapter) => {
  const deps: TimerDeps = {
    now: () => Date.now(),
    pushUsage: async () => Promise.resolve(),
    pushSettings: async (_: TimerSettings) => Promise.resolve(),
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

        const start = () => {
          checkDailyReset();

          const state = get();
          const duration = state.prevRemaining ?? state.durations[state.stage];
          const end = deps.now() + duration * 1000;
          runtime.sendMessage({ type: "START", duration });
          set({ isRunning: true, endTimestamp: end, prevRemaining: duration });

          timerEvents.emit({
            type: 'timer:start',
            stage: state.stage === TimerStage.Focus ? 'focus' : 'break',
            duration,
            remaining: duration,
            data: {
              soundscapesEnabled: state.settings.soundscapes ?? true,
            },
          });
        };

        const pause = () => {
          const state = get();
          const end = state.endTimestamp;
          const remain =
            end !== null
              ? Math.max(0, Math.ceil((end - deps.now()) / 1000))
              : null;
          runtime.sendMessage({ type: "PAUSE" });
          set({ isRunning: false, endTimestamp: null, prevRemaining: remain });

          timerEvents.emit({
            type: 'timer:pause',
            stage: state.stage === TimerStage.Focus ? 'focus' : 'break',
            remaining: remain ?? undefined,
            data: {
              soundscapesEnabled: state.settings.soundscapes ?? true,
            },
          });
        };

        const reset = () => {
          const state = get();
          const duration = state.durations[TimerStage.Focus];
          runtime.sendMessage({ type: "RESET" });
          set({
            stage: TimerStage.Focus,
            isRunning: false,
            endTimestamp: null,
            stats: { focusSec: 0, breakSec: 0 },
            unsyncedFocusSec: 0,
            prevRemaining: duration,
          });

          timerEvents.emit({
            type: 'timer:reset',
            stage: 'focus',
            data: {
              soundscapesEnabled: state.settings.soundscapes ?? true,
            },
          });
        };

        const skipToStage = (stage: TimerStage) => {
          const duration = get().durations[stage];
          runtime.sendMessage({ type: "SKIP_TO_NEXT_STAGE" });
          set({
            stage,
            isRunning: false,
            endTimestamp: null,
            prevRemaining: duration,
          });
        };

        const updateDurations = (
          d: Partial<{ focus: number; break: number }>
        ) => {
          set((s) => {
            const newDurations = {
              [TimerStage.Focus]: d.focus ?? s.durations[TimerStage.Focus],
              [TimerStage.Break]: d.break ?? s.durations[TimerStage.Break],
            };

            const stageKey = s.stage === TimerStage.Focus ? 'focus' : 'break';
            const shouldUpdatePrevRemaining = !s.isRunning && d[stageKey] !== undefined;

            return {
              durations: newDurations,
              prevRemaining: shouldUpdatePrevRemaining
                ? newDurations[s.stage]
                : s.prevRemaining,
            };
          });

          const state = get();
          const stageKey = state.stage === TimerStage.Focus ? 'focus' : 'break';
          if (state.isRunning && d[stageKey] !== undefined) {
            runtime.sendMessage({
              type: "UPDATE_DURATION",
              duration: d[stageKey]!,
            });
          }

          timerEvents.emit({
            type: 'timer:duration-update',
            stage: state.stage === TimerStage.Focus ? 'focus' : 'break',
            duration: d.focus ?? d.break ?? state.durations[state.stage],
            data: {
              focus: d.focus ?? state.durations[TimerStage.Focus],
              break: d.break ?? state.durations[TimerStage.Break],
            },
          });
        };

        const toggleNotifications = () => {
          set((s) => ({
            settings: {
              ...s.settings,
              notifications: !s.settings.notifications,
            },
          }));
        };

        const toggleSounds = () => {
          set((s) => ({
            settings: { ...s.settings, sounds: !s.settings.sounds },
          }));
        };

        const toggleAutoStartBreaks = () => {
          set((s) => ({
            settings: { ...s.settings, autoStartBreaks: !s.settings.autoStartBreaks },
          }));
        };

        const updateRemaining = (remaining: number) => {
          const s = get();
          if (s.prevRemaining !== null && s.isRunning) {
            const diff = s.prevRemaining - remaining;
            if (s.stage === TimerStage.Focus) {
              const focus = s.stats.focusSec + diff;
              const unsynced = s.unsyncedFocusSec + diff;

              set({
                stats: { ...s.stats, focusSec: focus },
                unsyncedFocusSec: unsynced,
                prevRemaining: remaining,
              });
              if (unsynced >= 300) {
                deps
                  .pushUsage(unsynced)
                  .then(() => set({ unsyncedFocusSec: 0 }))
                  .catch((error: Error) => {
                    console.error("sync usage failed", error);
                  });
              }
            } else {
              set({
                stats: { ...s.stats, breakSec: s.stats.breakSec + diff },
                prevRemaining: remaining,
              });
            }
          } else {
            set({ prevRemaining: remaining });
          }
        };

        const checkDailyReset = () => {
          const now = new Date();
          const todayStr = now.toISOString().split("T")[0];
          const lastResetDate = localStorage.getItem(
            "meelio:simple-timer:lastReset"
          );

          if (lastResetDate !== todayStr) {
            set((state) => ({
              stats: {
                ...state.stats,
                focusSec: 0,
                breakSec: 0,
              },
            }));

            localStorage.setItem("meelio:simple-timer:lastReset", todayStr);
          }
        };

        const restore = () => {
          checkDailyReset();

          const s = get();
          if (!s.isRunning || !s.endTimestamp) return;
          const left = Math.ceil((s.endTimestamp - deps.now()) / 1000);
          if (left <= 0) {
            set({ isRunning: false, endTimestamp: null });
            runtime.sendMessage({ type: "RESET" });
          } else {
            runtime.sendMessage({ type: "START", duration: left });
            set({ prevRemaining: left });
          }
        };

        const completeStage = () => {
          const state = get();
          const finishedStage = state.stage;
          const completedDuration = state.durations[finishedStage];

          if (finishedStage === TimerStage.Focus) {
            addSimpleTimerFocusTime(completedDuration).catch((error) => {
              console.error("Failed to save focus time to database:", error);
            });
          } else if (finishedStage === TimerStage.Break) {
            addSimpleTimerBreakTime(completedDuration).catch((error) => {
              console.error("Failed to save break time to database:", error);
            });
          }

          playCompletionSound(state.settings.sounds, state.settings.soundId).catch(console.error);
          showCompletionNotification(
            finishedStage,
            state.settings.notifications
          );

          const nextStage =
            finishedStage === TimerStage.Focus
              ? TimerStage.Break
              : TimerStage.Focus;
          const duration = state.durations[nextStage];

          timerEvents.emit({
            type: 'timer:complete',
            stage: finishedStage === TimerStage.Focus ? 'focus' : 'break',
            duration: completedDuration,
            data: {
              nextStage: nextStage === TimerStage.Focus ? 'focus' : 'break',
              soundscapesEnabled: state.settings.soundscapes ?? true,
            },
          });

          set({
            stage: nextStage,
            isRunning: false,
            endTimestamp: null,
            prevRemaining: duration,
          });

          timerEvents.emit({
            type: 'timer:stage-change',
            stage: nextStage === TimerStage.Focus ? 'focus' : 'break',
            data: {
              soundscapesEnabled: get().settings.soundscapes ?? true,
            },
          });
        };

        return {
          ...initState(),
          start,
          pause,
          reset,
          skipToStage,
          updateDurations,
          toggleNotifications,
          toggleSounds,
          toggleAutoStartBreaks,
          toggleSoundscapes: () => set((s) => ({
            settings: { ...s.settings, soundscapes: !s.settings.soundscapes }
          })),
          setSoundId: (id: string) => set((s) => ({
            settings: { ...s.settings, soundId: id }
          })),
          updateRemaining,
          restore,
          completeStage,
          checkDailyReset,
          playCompletionSound: () => playCompletionSound(get().settings.sounds).catch(console.error),
          showCompletionNotification: (stage: TimerStage) =>
            showCompletionNotification(stage, get().settings.notifications),
        } as TimerState & {
          completeStage: () => void;
          checkDailyReset: () => void;
          playCompletionSound: () => void;
          showCompletionNotification: (stage: TimerStage) => void;
        };
      },
      {
        name: "meelio:simple-timer",
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({
          stage: s.stage,
          durations: s.durations,
          settings: s.settings,
          stats: s.stats,
          isRunning: s.isRunning,
          endTimestamp: s.endTimestamp,
          prevRemaining: s.prevRemaining,
        }),
      }
    )
  );
};
