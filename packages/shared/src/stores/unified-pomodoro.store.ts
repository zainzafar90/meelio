import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { PomodoroStage, PomodoroState } from "../types/pomodoro";
import { db } from "../lib/db/meelio.dexie";
import { useSyncStore } from "./sync.store";
import { generateUUID } from "../utils/common.utils";
import { getTodaysSummary, addFocusTimeMinute } from "../lib/db/pomodoro.dexie";
import { useAppStore } from "./app.store";
import { useAuthStore } from "./auth.store";
import { api } from "../api";
import * as focusSessionsApi from "../api/focus-sessions.api";
import { PomodoroSettings } from "../types/auth";
import { DEFAULT_SETTINGS, pomodoroSounds } from "../data";
import { toast } from "sonner";

const isExtension = useAppStore.getState().platform === "extension";

interface PomodoroStateWithSync extends PomodoroState {
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  updateTimer: (remaining: number) => void;
  advanceTimer: () => void;
  changeStage: (stage: PomodoroStage) => void;
  changeTimerSettings: (settings: Partial<PomodoroSettings>) => Promise<void>;
  sessionCompleted: () => void;
  toggleAutoStartBreaks: () => Promise<void>;
  setTimerDuration: (duration: number) => void;
  toggleTimerSound: () => Promise<void>;
  updateNotificationSoundId: (soundId: string) => Promise<void>;
  updateNotificationEnabled: (enabled: boolean) => void;
  isTimerRunning: () => boolean;

  // Sync methods
  completeSession: () => Promise<void>;
  syncSessions: () => Promise<void>;
  loadTodayStats: () => Promise<void>;
  syncWithUserSettings: () => void;
  reinitializeTimer: () => void;

  // Focus time tracking
  lastFocusTrackTime: number;
  trackFocusTime: (currentRemaining: number) => void;
  syncFocusTime: () => Promise<void>;
  saveFocusTimeIncrement: (elapsedSeconds: number) => Promise<void>;

  // Daily limit checking - simplified
  getDailyLimitStatus: () => {
    isLimitReached: boolean;
    remainingTime: number;
    isProUser: boolean;
  };

  // Notification and sound methods
  playCompletionSound: () => void;
  setNotificationSoundEnabled: (enabled: boolean) => void;
  showCompletionNotification: (stage: PomodoroStage) => void;
  requestNotificationPermission: () => Promise<boolean>;
}

export const usePomodoroStore = create(
  persist(
    subscribeWithSelector<PomodoroStateWithSync>((set, get) => {
      return {
        id: 1,
        stats: {
          todaysFocusSessions: 0,
          todaysBreaks: 0,
          todaysFocusTime: 0,
          todaysBreakTime: 0,
        },
        activeStage: PomodoroStage.Focus,
        isRunning: false,
        endTimestamp: null,
        sessionCount: 0,
        stageDurations: {
          [PomodoroStage.Focus]: 25 * 60,
          [PomodoroStage.Break]: 5 * 60,
        },
        autoStartTimers: true,
        enableSound: false,
        notificationSoundId: "timeout-1-back-chime",
        notificationEnabled: false,
        notificationSoundEnabled: false,
        pausedRemaining: null,
        lastUpdated: Date.now(),
        lastFocusTrackTime: 0,
        dailyFocusLimit:
          DEFAULT_SETTINGS.pomodoro.dailyFocusLimit * 60,
        // Daily limit stored in seconds

        // Timer control methods
        startTimer: () => {
          set({ isRunning: true });
          const state = get();
          if (state.activeStage === PomodoroStage.Focus) {
            const duration = state.stageDurations[state.activeStage];
            state.trackFocusTime(duration);
          }
        },

        pauseTimer: () => {
          set({ isRunning: false });
          get().trackFocusTime(0);
        },

        resumeTimer: () => {
          set({ isRunning: true });
          const state = get();
          if (state.activeStage === PomodoroStage.Focus) {
            const remaining =
              state.pausedRemaining || state.stageDurations[state.activeStage];
            state.trackFocusTime(remaining);
          }
        },

        resetTimer: () => {
          get().trackFocusTime(0);
          set(() => ({
            isRunning: false,
            activeStage: PomodoroStage.Focus,
            sessionCount: 0,
            pausedRemaining: null,
            ...DEFAULT_SETTINGS.pomodoro,
          }));
        },

        updateTimer: (remaining: number) => {
          const state = get();

          // Track focus time if we're in focus mode and running
          if (
            state.activeStage === PomodoroStage.Focus &&
            state.isRunning &&
            state.lastFocusTrackTime > 0
          ) {
            const elapsedTime = state.lastFocusTrackTime - remaining;
            if (elapsedTime > 0) {
              const newFocusTime = state.stats.todaysFocusTime + elapsedTime;

              set((state) => ({
                stats: {
                  ...state.stats,
                  todaysFocusTime: newFocusTime,
                },
                pausedRemaining: remaining,
                lastFocusTrackTime: remaining,
              }));

              // Save to IndexedDB and queue for sync every 60 seconds of accumulated time
              const totalElapsed = Math.floor(newFocusTime / 60) * 60;
              const lastSaved =
                Math.floor((newFocusTime - elapsedTime) / 60) * 60;

              if (totalElapsed > lastSaved) {
                get().saveFocusTimeIncrement(60);
              }
            }
          } else {
            set({ pausedRemaining: remaining, lastFocusTrackTime: remaining });
          }
        },

        advanceTimer: () => {
          get().trackFocusTime(0);

          set((state) => {
            let nextStage: PomodoroStage;
            let newSessionCount = state.sessionCount;

            if (state.activeStage === PomodoroStage.Focus) {
              newSessionCount++;
              nextStage = PomodoroStage.Break;
            } else {
              nextStage = PomodoroStage.Focus;
            }

            const newState = {
              activeStage: nextStage,
              sessionCount: newSessionCount,
              isRunning:
                state.autoStartTimers || nextStage === PomodoroStage.Focus,
              pausedRemaining: null,
            };

            return newState;
          });

          // Start tracking if we're now in focus mode and running
          const state = get();

          if (state.activeStage === PomodoroStage.Focus && state.isRunning) {
            const duration = state.stageDurations[state.activeStage];
            state.trackFocusTime(duration);
          }
        },

        changeStage: (stage: PomodoroStage) => {
          get().trackFocusTime(0);
          set({
            activeStage: stage,
            isRunning: false,
            pausedRemaining: null,
          });
        },

        changeTimerSettings: async (settings: Partial<PomodoroSettings>) => {
          const currentState = get();

          set((state) => ({
            ...settings,
            stageDurations: {
              ...state.stageDurations,
              [settings.workDuration]: settings.workDuration * 60,
              [settings.breakDuration]: settings.breakDuration * 60,
            },
            autoStartTimers: settings.autoStart,
            enableSound: settings.soundOn,
            autoBlock: settings.autoBlock,
            dailyFocusLimit: settings.dailyFocusLimit * 60,
          }));

          const authState = useAuthStore.getState();
          if (authState.user) {
            try {
              await api.settings.settingsApi.updatePomodoroSettings(settings);

              if (
                (settings.workDuration !== undefined ||
                  settings.breakDuration !== undefined) &&
                !currentState.isRunning
              ) {
                set({
                  pausedRemaining: null,
                  lastUpdated: Date.now(),
                });
              }
            } catch (error) {
              set((state) => ({
                ...state,
                ...DEFAULT_SETTINGS.pomodoro,
              }));
            }
          }
        },

        sessionCompleted: () =>
          set({
            sessionCount: 0,
            isRunning: false,
          }),

        toggleAutoStartBreaks: async () => {
          const newAutoStart = !get().autoStartTimers;
          set({ autoStartTimers: newAutoStart });

          const authState = useAuthStore.getState();

          if (authState.user) {
            try {
              await api.settings.settingsApi.updatePomodoroSettings({
                autoStart: newAutoStart,
              });
            } catch (error) {
              console.error(
                "Failed to update auto-start setting on server:",
                error
              );
              toast.error("Failed to update auto-start setting on server");
            }
          }
        },

        setTimerDuration: (duration: number) =>
          set({ pausedRemaining: duration }),

        toggleTimerSound: async () => {
          const newSoundSetting = !get().enableSound;
          set({ enableSound: newSoundSetting });

          const authState = useAuthStore.getState();
          if (authState.user) {
            try {
              await api.settings.settingsApi.updatePomodoroSettings({
                soundOn: newSoundSetting,
              });
            } catch (error) {
              console.error("Failed to update sound setting on server:", error);
              toast.error("Failed to update sound setting on server");
            }
          }
        },

        updateNotificationSoundId: async (soundId: string) => {
          set({ notificationSoundId: soundId });
        },

        updateNotificationEnabled: (enabled: boolean) => {
          set({ notificationEnabled: enabled });
        },

        isTimerRunning: () => get().isRunning,

        completeSession: async () => {
          const state = get();
          const syncStore = useSyncStore.getState();
          const authState = useAuthStore.getState();

          const sessionId = generateUUID();
          const session = {
            id: sessionId,
            timestamp: Date.now(),
            stage: state.activeStage === PomodoroStage.Focus ? 0 : 1,
            duration: state.stageDurations[state.activeStage],
            completed: true,
          };

          await db.focusSessions.add({
            timestamp: session.timestamp,
            stage: session.stage,
            duration: session.duration,
            completed: session.completed,
          });

          const newStats = { ...state.stats };
          if (state.activeStage === PomodoroStage.Focus) {
            newStats.todaysFocusSessions++;
            newStats.todaysFocusTime += state.stageDurations[state.activeStage];
          } else {
            newStats.todaysBreaks++;
            newStats.todaysBreakTime += state.stageDurations[state.activeStage];
          }

          set({ stats: newStats });

          if (authState.user) {
            syncStore.addToQueue("pomodoro", {
              type: "create",
              entityId: sessionId,
              data: session,
            });

            if (syncStore.isOnline) {
              get().syncSessions();
            }
          }
        },

        syncSessions: async () => {
          const syncStore = useSyncStore.getState();

          if (!syncStore.isOnline || syncStore.syncingEntities.has("pomodoro"))
            return;

          syncStore.setSyncing("pomodoro", true);

          try {
            const queue = syncStore.getQueue("pomodoro");

            for (const op of queue) {
              if (op.retries >= 3) {
                syncStore.removeFromQueue("pomodoro", op.id);
                continue;
              }

              try {
                if (op.type === "create") {
                  // TODO: Replace with actual API call
                  // await pomodoroApi.createSession(op.data);
                  syncStore.removeFromQueue("pomodoro", op.id);
                }
              } catch (error) {
                console.error("Pomodoro sync failed:", error);
                syncStore.incrementRetry("pomodoro", op.id);
              }
            }

            syncStore.setLastSyncTime("pomodoro", Date.now());
          } finally {
            syncStore.setSyncing("pomodoro", false);
          }
        },

        loadTodayStats: async () => {
          const summary = await getTodaysSummary();
          set({
            sessionCount: summary.focusSessions,
            stats: {
              todaysFocusSessions: summary.focusSessions,
              todaysBreaks: summary.breaks,
              todaysFocusTime: summary.totalFocusTime,
              todaysBreakTime: summary.totalBreakTime,
            },
          });
        },

        syncWithUserSettings: () => {
          const authState = useAuthStore.getState();
          const user = authState.user;

          if (user?.settings?.pomodoro) {
            const pomodoroSettings = user.settings.pomodoro;
            set({
              stageDurations: {
                [PomodoroStage.Focus]: pomodoroSettings.workDuration * 60,
                [PomodoroStage.Break]: pomodoroSettings.breakDuration * 60,
              },
              autoStartTimers: pomodoroSettings.autoStart,
              enableSound: pomodoroSettings.soundOn,
              dailyFocusLimit: pomodoroSettings.dailyFocusLimit * 60,
            });
          }
        },

        reinitializeTimer: () => {
          const state = get();
          set({
            isRunning: false,
            pausedRemaining: null,
            lastUpdated: Date.now(),
            endTimestamp: null,
            activeStage: state.activeStage,
            stageDurations: state.stageDurations,
            autoStartTimers: state.autoStartTimers,
            enableSound: state.enableSound,
            notificationSoundId: state.notificationSoundId,
            notificationSoundEnabled: state.notificationSoundEnabled,
            sessionCount: state.sessionCount,
            stats: state.stats,
          });
        },

        // Focus time tracking
        trackFocusTime: (currentRemaining: number) => {
          set({ lastFocusTrackTime: currentRemaining });
        },

        saveFocusTimeIncrement: async (elapsedSeconds: number) => {
          try {
            await addFocusTimeMinute();

            const authState = useAuthStore.getState();
            if (authState.user) {
              const syncStore = useSyncStore.getState();
              const today = new Date().toISOString().split("T")[0];

              syncStore.addToQueue("focus-time", {
                type: "update",
                entityId: today,
                data: { date: today, focusTime: elapsedSeconds },
              });

              if (syncStore.isOnline) {
                get().syncFocusTime();
              }
            }
          } catch (error) {
            console.error("❌ Failed to save focus time increment:", error);
          }
        },

        syncFocusTime: async () => {
          const syncStore = useSyncStore.getState();
          const authState = useAuthStore.getState();

          if (
            !authState.user ||
            !syncStore.isOnline ||
            syncStore.syncingEntities.has("focus-time")
          ) {
            return;
          }

          syncStore.setSyncing("focus-time", true);

          try {
            const queue = syncStore.getQueue("focus-time");

            const focusTimeByDate = new Map<string, number>();

            // Aggregate focus time by date
            queue.forEach((op) => {
              if (op.type === "update" && op.data?.focusTime) {
                const date = op.data.date;
                const currentTime = focusTimeByDate.get(date) || 0;
                focusTimeByDate.set(date, currentTime + op.data.focusTime);
              }
            });

            // Create focus sessions for each date
            for (const [date, totalFocusTime] of focusTimeByDate) {
              try {
                const sessionStart = new Date(date + "T00:00:00.000Z");
                const sessionEnd = new Date(
                  sessionStart.getTime() + totalFocusTime * 1000
                );

                await focusSessionsApi.createFocusSession({
                  sessionStart: sessionStart.toISOString(),
                  sessionEnd: sessionEnd.toISOString(),
                  duration: Math.floor(totalFocusTime / 60), // Convert to minutes
                });

                queue.forEach((op) => {
                  if (op.data?.date === date) {
                    syncStore.removeFromQueue("focus-time", op.id);
                  }
                });
              } catch (error) {
                queue.forEach((op) => {
                  if (op.data?.date === date) {
                    syncStore.incrementRetry("focus-time", op.id);
                  }
                });
              }
            }

            syncStore.setLastSyncTime("focus-time", Date.now());
          } finally {
            syncStore.setSyncing("focus-time", false);
          }
        },

        getDailyLimitStatus: () => {
          const state = get();
          const authState = useAuthStore.getState();
          const user = authState.user || authState.guestUser;

          // Pro users have no limit
          if (user && authState.user?.isPro) {
            return {
              isLimitReached: false,
              remainingTime: Infinity,
              isProUser: true,
            };
          }

          const dailyLimit = state.dailyFocusLimit;
          const todaysFocusTime = state.stats.todaysFocusTime;
          const remainingTime = Math.max(0, dailyLimit - todaysFocusTime);

          return {
            isLimitReached: todaysFocusTime >= dailyLimit,
            remainingTime,
            isProUser: false,
          };
        },

        playCompletionSound: () => {
          const state = get();

          if (!state.notificationSoundEnabled) return;

          try {
            const sound = pomodoroSounds.find(
              (sound) => sound.id === state.notificationSoundId
            );

            if (!sound) return;

            const audio = new Audio(sound.url);
            audio.volume = 0.5;
            audio.play().catch((error) => {
              console.error("Failed to play timer sound:", error);
            });
          } catch (error) {
            console.error("Error playing completion sound:", error);
          }
        },

        setNotificationSoundEnabled: (enabled: boolean) => {
          set({ notificationSoundEnabled: enabled });
        },

        showCompletionNotification: (stage: PomodoroStage) => {
          const useChrome =
            isExtension && typeof chrome?.notifications !== "undefined";

          const title =
            stage === PomodoroStage.Focus
              ? "Focus session complete! 🎯"
              : "Break time is over! ☕";
          const body =
            stage === PomodoroStage.Focus
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
        },

        requestNotificationPermission: async () => {
          if ("Notification" in window) {
            if (Notification.permission === "default") {
              const permission = await Notification.requestPermission();
              return permission === "granted";
            }
            return Notification.permission === "granted";
          }
          return false;
        },
      };
    }),
    {
      name: "meelio:local:pomodoro",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      skipHydration: false,
      partialize: (state) => ({
        id: state.id,
        stats: state.stats,
        activeStage: state.activeStage,
        isRunning: state.isRunning,
        endTimestamp: state.endTimestamp,
        sessionCount: state.sessionCount,
        stageDurations: state.stageDurations,
        autoStartTimers: state.autoStartTimers,
        enableSound: state.enableSound,
        notificationSoundId: state.notificationSoundId,
        notificationSoundEnabled: state.notificationSoundEnabled,
        dailyFocusLimit: state.dailyFocusLimit,
      }),
    }
  )
);

// Auto-sync every 10 minutes
if (typeof window !== "undefined" && !isExtension) {
  setInterval(
    () => {
      const syncStore = useSyncStore.getState();
      if (syncStore.isOnline && !syncStore.syncingEntities.has("pomodoro")) {
        usePomodoroStore.getState().syncSessions();
      }
      // Also sync focus time
      if (syncStore.isOnline && !syncStore.syncingEntities.has("focus-time")) {
        usePomodoroStore.getState().syncFocusTime();
      }
    },
    10 * 60 * 1000
  );
}

// Subscribe to auth store changes to sync settings
useAuthStore.subscribe((state) => {
  if (state.user?.settings?.pomodoro) {
    usePomodoroStore.getState().syncWithUserSettings();
  } else if (!state.user && !state.guestUser) {
    const store = usePomodoroStore.getState();
    store.trackFocusTime(0);
    store.resetTimer();
  }
});

const checkPeriodicReset = () => {
  const now = new Date();
  const todayString = now.toISOString().split("T")[0];
  const lastResetDate = localStorage.getItem("meelio:lastDailyReset");
  const state = usePomodoroStore.getState();

  if (
    lastResetDate !== todayString &&
    state.getDailyLimitStatus().isLimitReached
  ) {
    // Reset stats to zero instead of loading from database
    usePomodoroStore.setState({
      stats: {
        todaysFocusSessions: 0,
        todaysBreaks: 0,
        todaysFocusTime: 0,
        todaysBreakTime: 0,
      },
      sessionCount: 0,
    });

    state.resetTimer();
    state.trackFocusTime(0);
    state.loadTodayStats();
    localStorage.setItem("meelio:lastDailyReset", todayString);

    toast.success("Daily focus time reset");
  }
};

checkPeriodicReset();
