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
import { useSoundscapesStore } from "./soundscapes.store";
import { Category } from "../types/category";
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
    settings: { notifications: true, sounds: true },
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
              console.log(
                "❌ Cannot start focus timer: Today's limit reached. Try again tomorrow!"
              );
              return;
            }
          }

          const duration = state.prevRemaining ?? state.durations[state.stage];
          const end = deps.now() + duration * 1000;
          deps.postMessage?.({ type: "START", duration });
          set({ isRunning: true, endTimestamp: end, prevRemaining: duration });
          
          // Handle soundscapes when focus starts
          if (state.stage === TimerStage.Focus) {
            const soundscapesState = useSoundscapesStore.getState();
            
            // Check if any soundscapes are currently playing
            const hasPlayingSounds = soundscapesState.sounds.some(sound => sound.playing);
            
            if (hasPlayingSounds) {
              // If soundscapes are already playing, let them continue
              soundscapesState.resumePausedSounds();
            } else {
              // If no soundscapes are playing, auto-start productivity sounds
              soundscapesState.playCategory(Category.Productivity);
            }
          }
        };

        const pause = () => {
          const end = get().endTimestamp;
          const remain =
            end !== null
              ? Math.max(0, Math.ceil((end - deps.now()) / 1000))
              : null;
          deps.postMessage?.({ type: "PAUSE" });
          set({ isRunning: false, endTimestamp: null, prevRemaining: remain });
          
          // Pause soundscapes when timer is paused
          useSoundscapesStore.getState().pausePlayingSounds();
        };

        const reset = () => {
          const duration = get().durations[TimerStage.Focus];
          deps.postMessage?.({ type: "RESET" });
          set({
            stage: TimerStage.Focus,
            isRunning: false,
            endTimestamp: null,
            stats: { focusSec: 0, breakSec: 0 },
            unsyncedFocusSec: 0,
            prevRemaining: duration,
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
          set((s) => ({
            durations: {
              [TimerStage.Focus]: d.focus ?? s.durations[TimerStage.Focus],
              [TimerStage.Break]: d.break ?? s.durations[TimerStage.Break],
            },
          }));
          const current = get();
          if (current.isRunning && d[current.stage]) {
            deps.postMessage?.({
              type: "UPDATE_DURATION",
              duration: d[current.stage]!,
            });
          }
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

        const updateRemaining = (remaining: number) => {
          const s = get();
          if (s.prevRemaining !== null && s.isRunning) {
            const diff = s.prevRemaining - remaining;
            if (s.stage === TimerStage.Focus) {
              const focus = s.stats.focusSec + diff;
              const unsynced = s.unsyncedFocusSec + diff;

              // Check if limit is reached
              const limitStatus = getLimitStatus();
              if (limitStatus.isLimitReached) {
                console.log("⚠️ Today's focus limit reached, pausing timer");
                pause();
                // Show notification about limit reached
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
                focusSec: 0, // Reset focus time to 0
                breakSec: 0, // Reset break time to 0
              },
            }));

            // Save the reset date
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

          // Save completed stage to database
          if (finishedStage === TimerStage.Focus) {
            addSimpleTimerFocusTime(completedDuration).catch((error) => {
              console.error("Failed to save focus time to database:", error);
            });
          } else if (finishedStage === TimerStage.Break) {
            addSimpleTimerBreakTime(completedDuration).catch((error) => {
              console.error("Failed to save break time to database:", error);
            });
          }

          // Play sound and show notification
          playCompletionSound(state.settings.sounds).catch(console.error);
          showCompletionNotification(
            finishedStage,
            state.settings.notifications
          );

          // Switch to next stage
          const nextStage =
            finishedStage === TimerStage.Focus
              ? TimerStage.Break
              : TimerStage.Focus;
          const duration = state.durations[nextStage];

          // Check if we're switching to focus and limit is reached
          if (nextStage === TimerStage.Focus) {
            const limitStatus = getLimitStatus();
            if (limitStatus.isLimitReached) {
              console.log(
                "⚠️ Today's focus limit reached after stage completion"
              );
              // Show special notification
              platform.showNotification(
                "Today's Focus Complete! 🎉",
                "You've completed today's focus goal. Enjoy your break - see you tomorrow!"
              );
            }
          }

          // Pause soundscapes when switching to break
          if (nextStage === TimerStage.Break) {
            useSoundscapesStore.getState().pausePlayingSounds();
          }

          set({
            stage: nextStage,
            isRunning: false,
            endTimestamp: null,
            prevRemaining: duration,
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

// Create singleton stores for each platform
let extensionStore: ReturnType<typeof createTimerStore> | null = null;
let webStore: ReturnType<typeof createTimerStore> | null = null;

export const useTimerStore = () => {
  const platform = getTimerPlatform();
  
  // Check if we're in extension or web context
  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;
  
  if (isExtension) {
    if (!extensionStore) {
      extensionStore = createTimerStore(platform);
    }
    return extensionStore;
  } else {
    if (!webStore) {
      webStore = createTimerStore(platform);
    }
    return webStore;
  }
};