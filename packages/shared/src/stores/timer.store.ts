import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { pomodoroSounds } from "../data";
import {
  TimerStage,
  TimerState,
  TimerDeps,
  TimerSettings,
} from "../types/timer.types";
import {
  addSimpleTimerFocusTime,
  addSimpleTimerBreakTime,
} from "../lib/db/pomodoro.dexie";
import { getTimerPlatform, TimerPlatform } from "../lib/timer.platform";
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
  | "getLimitStatus"
  | "sync"
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
    settings: { notifications: true, sounds: true, soundscapes: true, autoStartBreaks: true },
    stats: { focusSec: 0, breakSec: 0 },
    dailyLimitSec: 120 * 60 * 60,
    unsyncedFocusSec: 0,
    prevRemaining: null,
  };
}

export const createTimerStore = (platform: TimerPlatform) => {
  const deps: TimerDeps = {
    now: () => Date.now(),
    pushUsage: async () => Promise.resolve(),
    pushSettings: async (_: TimerSettings) => Promise.resolve(),
    postMessage: (msg) => platform.sendMessage(msg),
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

          platform.showNotification(title, body);
        };

        const start = () => {
          checkDailyReset();

          const state = get();

          if (state.stage === TimerStage.Focus) {
            const limitStatus = getLimitStatus();
            if (limitStatus.isLimitReached) {
              // "❌ Cannot start focus timer: Today's limit reached. Try again tomorrow!"
              return;
            }
          }

          const duration = state.prevRemaining ?? state.durations[state.stage];
          const end = deps.now() + duration * 1000;
          deps.postMessage?.({ type: "START", duration });
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
          deps.postMessage?.({ type: "PAUSE" });
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
          deps.postMessage?.({ type: "RESET" });
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
          deps.postMessage?.({ type: "SKIP_TO_NEXT_STAGE" });
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
            deps.postMessage?.({
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

              const limitStatus = getLimitStatus();
              if (limitStatus.isLimitReached) {
                pause();
                platform.showNotification(
                  "Daily Focus Limit Reached 🎯",
                  "You've hit today's focus limit! Take a well-deserved break. Your limit resets tomorrow."
                );
                return;
              }

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

        const getLimitStatus = () => {
          const auth = useAuthStore.getState();
          const isPro = !!auth.user?.isPro;
          const limit = isPro ? Infinity : get().dailyLimitSec;
          const used = get().stats.focusSec;
          return {
            isLimitReached: used >= limit,
            remainingSec: Math.max(0, limit - used),
          };
        };

        const sync = async () => {
          const auth = useAuthStore.getState();
          if (!auth.user?.isPro) return;
          const settings = get().settings;
          try {
            await deps.pushSettings(settings);
          } catch (error) {
            console.error("sync settings failed", error);
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
            deps.postMessage?.({ type: "RESET" });
          } else {
            deps.postMessage?.({ type: "START", duration: left });
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

          playCompletionSound(state.settings.sounds).catch(console.error);
          showCompletionNotification(
            finishedStage,
            state.settings.notifications
          );

          const nextStage =
            finishedStage === TimerStage.Focus
              ? TimerStage.Break
              : TimerStage.Focus;
          const duration = state.durations[nextStage];

          if (nextStage === TimerStage.Focus) {
            const limitStatus = getLimitStatus();
            if (limitStatus.isLimitReached) {
              // "⚠️ Today's focus limit reached after stage completion"
              platform.showNotification(
                "Today's Focus Complete! 🎉",
                "You've completed today's focus goal. Enjoy your break - see you tomorrow!"
              );
            }
          }

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
          updateRemaining,
          getLimitStatus,
          sync,
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

const createStoreRegistry = () => {
  const registry = {
    extensionStore: null as ReturnType<typeof createTimerStore> | null,
    webStore: null as ReturnType<typeof createTimerStore> | null,
  };

  return {
    getExtensionStore: () => registry.extensionStore,
    setExtensionStore: (store: ReturnType<typeof createTimerStore>) => {
      registry.extensionStore = store;
    },
    getWebStore: () => registry.webStore,
    setWebStore: (store: ReturnType<typeof createTimerStore>) => {
      registry.webStore = store;
    },
  };
};

const storeRegistry = createStoreRegistry();

export const useTimerStore = () => {
  const platform = getTimerPlatform();

  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;

  if (isExtension) {
    const extensionStore = storeRegistry.getExtensionStore();
    if (!extensionStore) {
      const newStore = createTimerStore(platform);
      storeRegistry.setExtensionStore(newStore);
      return newStore;
    }
    return extensionStore;
  } else {
    const webStore = storeRegistry.getWebStore();
    if (!webStore) {
      const newStore = createTimerStore(platform);
      storeRegistry.setWebStore(newStore);
      return newStore;
    }
    return webStore;
  }
};