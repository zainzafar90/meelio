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

const isExtension = useAppStore.getState().platform === "extension";

interface PomodoroStateWithSync extends PomodoroState {
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  updateTimer: (remaining: number) => void;
  advanceTimer: () => void;
  changeStage: (stage: PomodoroStage) => void;
  changeTimerSettings: (stage: PomodoroStage, minutes: number) => void;
  sessionCompleted: () => void;
  toggleAutoStartBreaks: () => void;
  setTimerDuration: (duration: number) => void;
  toggleTimerSound: () => void;
  isTimerRunning: () => boolean;

  // Sync methods
  completeSession: () => Promise<void>;
  syncSessions: () => Promise<void>;
  loadTodayStats: () => Promise<void>;
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

      changeTimerSettings: (stage: PomodoroStage, minutes: number) =>
        set((state) => ({
          stageDurations: {
            ...state.stageDurations,
            [stage]: minutes * 60,
          },
        })),

      sessionCompleted: () =>
        set({
          sessionCount: 0,
          isRunning: false,
        }),

      toggleAutoStartBreaks: () =>
        set((state) => ({
          autoStartTimers: !state.autoStartTimers,
        })),

      setTimerDuration: (duration: number) =>
        set({ pausedRemaining: duration }),

      toggleTimerSound: () =>
        set((state) => ({
          enableSound: !state.enableSound,
        })),

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
    })),
    {
      name: "meelio:local:pomodoro",
      storage: createJSONStorage(() => localStorage),
      version: 2,
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
