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
import { getTodaysSummary } from "../lib/db/pomodoro.dexie";
import { useAppStore } from "./app.store";
import { useAuthStore } from "./auth.store";
import { api } from "../api";
import { PomodoroSettings } from "src/types/auth";

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
  isTimerRunning: () => boolean;

  // Sync methods
  completeSession: () => Promise<void>;
  syncSessions: () => Promise<void>;
  loadTodayStats: () => Promise<void>;
  syncWithUserSettings: () => void;
  reinitializeTimer: () => void;
}

export const usePomodoroStore = create(
  persist(
    subscribeWithSelector<PomodoroStateWithSync>((set, get) => ({
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
      pausedRemaining: null,
      lastUpdated: Date.now(),

      // Timer control methods
      startTimer: () => set({ isRunning: true }),

      pauseTimer: () => set({ isRunning: false }),

      resumeTimer: () => set({ isRunning: true }),

      resetTimer: () =>
        set((state) => ({
          isRunning: false,
          activeStage: PomodoroStage.Focus,
          sessionCount: 0,
          pausedRemaining: null,
        })),

      updateTimer: (remaining: number) => set({ pausedRemaining: remaining }),

      advanceTimer: () =>
        set((state) => {
          let nextStage: PomodoroStage;
          let newSessionCount = state.sessionCount;

          if (state.activeStage === PomodoroStage.Focus) {
            newSessionCount++;
            nextStage = PomodoroStage.Break;
          } else {
            nextStage = PomodoroStage.Focus;
          }

          return {
            activeStage: nextStage,
            sessionCount: newSessionCount,
            isRunning:
              state.autoStartTimers || nextStage === PomodoroStage.Focus,
            pausedRemaining: null,
          };
        }),

      changeStage: (stage: PomodoroStage) =>
        set({
          activeStage: stage,
          isRunning: false,
          pausedRemaining: null,
        }),

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
          dailyFocusLimit: settings.dailyFocusLimit,
        }));

        const authState = useAuthStore.getState();
        if (authState.user) {
          try {
            await api.settings.settingsApi.updatePomodoroSettings(settings);

            if (
              settings.workDuration ===
                currentState.stageDurations[PomodoroStage.Focus] &&
              settings.breakDuration ===
                currentState.stageDurations[PomodoroStage.Break] &&
              !currentState.isRunning
            ) {
              set({
                pausedRemaining: null,
                lastUpdated: Date.now(),
              });
            }
          } catch (error) {
            console.error("Failed to update timer settings on server:", error);
            set(() => ({
              ...currentState,
            }));
            throw error;
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

        // Update settings on server if user is authenticated
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
          }
        }
      },

      setTimerDuration: (duration: number) =>
        set({ pausedRemaining: duration }),

      toggleTimerSound: async () => {
        const newSoundSetting = !get().enableSound;
        set({ enableSound: newSoundSetting });

        // Update settings on server if user is authenticated
        const authState = useAuthStore.getState();
        if (authState.user) {
          try {
            await api.settings.settingsApi.updatePomodoroSettings({
              soundOn: newSoundSetting,
            });
          } catch (error) {
            console.error("Failed to update sound setting on server:", error);
          }
        }
      },

      isTimerRunning: () => get().isRunning,

      completeSession: async () => {
        const state = get();
        const syncStore = useSyncStore.getState();

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

        syncStore.addToQueue("pomodoro", {
          type: "create",
          entityId: sessionId,
          data: session,
        });

        if (syncStore.isOnline) {
          get().syncSessions();
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
          });
        }
      },

      reinitializeTimer: () => {
        const state = get();
        // Reset timer state while preserving settings
        set({
          isRunning: false,
          pausedRemaining: null,
          lastUpdated: Date.now(),
          endTimestamp: null,
          // Keep current stage and settings
          activeStage: state.activeStage,
          stageDurations: state.stageDurations,
          autoStartTimers: state.autoStartTimers,
          enableSound: state.enableSound,
          sessionCount: state.sessionCount,
          stats: state.stats,
        });
      },
    })),
    {
      name: "meelio:local:pomodoro",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      skipHydration: false,
      ...(isExtension
        ? {
            partialize: (state) => ({
              id: state.id,
              stats: state.stats,
              activeStage: state.activeStage,
              isRunning: state.isRunning,
              autoStartTimers: state.autoStartTimers,
              endTimestamp: state.endTimestamp,
            }),
          }
        : {}),
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
    },
    10 * 60 * 1000
  );
}

// Subscribe to auth store changes to sync settings
useAuthStore.subscribe((state) => {
  if (state.user?.settings?.pomodoro) {
    usePomodoroStore.getState().syncWithUserSettings();
  }
});
