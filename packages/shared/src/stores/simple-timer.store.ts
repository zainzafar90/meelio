import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { useAppStore } from "./app.store";
import { pomodoroSounds } from "../data";
import {
  TimerStage,
  TimerState,
  TimerDeps,
  TimerSettings,
} from "../types/new/pomodoro-lite";
import { addSimpleTimerFocusTime, addSimpleTimerBreakTime } from "../lib/db/pomodoro.dexie";

const isExtension = () => {
  try {
    return useAppStore.getState().platform === "extension";
  } catch {
    return false;
  }
};

const playCompletionSound = (
  soundEnabled: boolean,
  soundId: string = "timeout-1-back-chime"
) => {
  if (!soundEnabled) return;

  try {
    const sound = pomodoroSounds.find((s) => s.id === soundId);
    if (!sound) return;

    const audio = new Audio(sound.url);
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.error("Failed to play timer sound:", error);
    });
  } catch (error) {
    console.error("Error playing completion sound:", error);
  }
};

const showCompletionNotification = (
  stage: TimerStage,
  notificationsEnabled: boolean
) => {
  if (!notificationsEnabled) return;

  const useChrome =
    isExtension() && typeof chrome?.notifications !== "undefined";

  const title =
    stage === TimerStage.Focus
      ? "Focus session complete! 🎯"
      : "Break time is over! ☕";
  const body =
    stage === TimerStage.Focus
      ? "Great work! Time for a break."
      : "Ready to focus again?";

  if (useChrome) {
    chrome.notifications.create({
      type: "basic",
      title,
      message: body,
      iconUrl: chrome.runtime.getURL("public/icon.png"),
      silent: true,
    });
  } else if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    const n = new Notification(title, {
      body,
      icon: "/icon.png",
      badge: "/icon.png",
      requireInteraction: false,
      silent: true,
    });
    setTimeout(() => n.close(), 5000);
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
    dailyLimitSec: 2 * 60,
    unsyncedFocusSec: 0,
    prevRemaining: null,
  };
}

export const createTimerStore = (deps: TimerDeps) =>
  create<TimerState>()(
    persist(
      (set, get) => {
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
        };

        const pause = () => {
          const end = get().endTimestamp;
          const remain =
            end !== null
              ? Math.max(0, Math.ceil((end - deps.now()) / 1000))
              : null;
          deps.postMessage?.({ type: "PAUSE" });
          set({ isRunning: false, endTimestamp: null, prevRemaining: remain });
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
                const useChrome =
                  isExtension() && typeof chrome?.notifications !== "undefined";

                if (useChrome) {
                  chrome.notifications.create({
                    type: "basic",
                    title: "Daily Focus Limit Reached 🎯",
                    message:
                      "You've hit today's focus limit! Take a well-deserved break. Your limit resets tomorrow.",
                    iconUrl: chrome.runtime.getURL("public/icon.png"),
                    silent: false,
                  });
                } else if (
                  "Notification" in window &&
                  Notification.permission === "granted"
                ) {
                  new Notification("Daily Focus Limit Reached 🎯", {
                    body: "You've hit today's focus limit! Take a well-deserved break. Your limit resets tomorrow.",
                    icon: "/icon.png",
                  });
                }
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
            console.log("🌅 New day detected! Resetting daily focus stats");

            // Reset daily stats
            set((state) => ({
              stats: {
                ...state.stats,
                focusSec: 0, // Reset focus time to 0
                breakSec: 0, // Reset break time to 0
              },
            }));

            // Save the reset date
            localStorage.setItem("meelio:simple-timer:lastReset", todayStr);

            // Show notification about reset
            const useChrome =
              isExtension() && typeof chrome?.notifications !== "undefined";
            if (useChrome) {
              chrome.notifications.create({
                type: "basic",
                title: "Daily Focus Reset 🌅",
                message:
                  "Your daily focus limit has been reset. Ready for a productive day?",
                iconUrl: chrome.runtime.getURL("public/icon.png"),
                silent: false,
              });
            } else if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Daily Focus Reset 🌅", {
                body: "Your daily focus limit has been reset. Ready for a productive day?",
                icon: "/icon.png",
              });
            }
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
          playCompletionSound(state.settings.sounds);
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
              const useChrome =
                isExtension() && typeof chrome?.notifications !== "undefined";

              if (useChrome) {
                chrome.notifications.create({
                  type: "basic",
                  title: "Today's Focus Complete! 🎉",
                  message:
                    "You've completed today's focus goal. Enjoy your break - see you tomorrow!",
                  iconUrl: chrome.runtime.getURL("public/icon.png"),
                  silent: false,
                });
              } else if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification("Today's Focus Complete! 🎉", {
                  body: "You've completed today's focus goal. Enjoy your break - see you tomorrow!",
                  icon: "/icon.png",
                });
              }
            }
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
          playCompletionSound: () => playCompletionSound(get().settings.sounds),
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

export const useTimerStore = createTimerStore({
  now: () => Date.now(),
  pushUsage: async () => Promise.resolve(),
  pushSettings: async (_: TimerSettings) => Promise.resolve(),
  postMessage: (msg) => {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(msg);
      }
    } catch {
      // ignore
    }
  },
});
