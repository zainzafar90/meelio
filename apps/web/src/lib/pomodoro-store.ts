import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import { PomodoroStage, PomodoroState, db } from '@repo/shared';
import { useSimpleSyncStore } from '@repo/shared';

interface PomodoroStateWithSync extends PomodoroState {
  completeSession: () => Promise<void>;
  syncSessions: () => Promise<void>;
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
      
      completeSession: async () => {
        const state = get();
        const syncStore = useSimpleSyncStore.getState();
        
        const session = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          stage: state.activeStage === PomodoroStage.Focus ? 0 : 1,
          duration: state.stageDurations[state.activeStage],
          completed: true,
        };
        
        await db.focusSessions.add({
          ...session,
          id: Number(session.id.split('-').join(''))

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
          entityId: session.id,
          data: session,
        });
        
        if (syncStore.isOnline) {
          get().syncSessions();
        }
      },
      
      syncSessions: async () => {
        const syncStore = useSimpleSyncStore.getState();
        
        if (!syncStore.isOnline || syncStore.syncingEntities.has("pomodoro")) return;
        
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
                console.log("Syncing pomodoro session:", op.data);
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
    })),
    {
      name: 'meelio:local:pomodoro',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      skipHydration: false,
    }
  )
);

// Auto-sync every 10 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    const syncStore = useSimpleSyncStore.getState();
    if (syncStore.isOnline && !syncStore.syncingEntities.has("pomodoro")) {
      usePomodoroStore.getState().syncSessions();
    }
  }, 10 * 60 * 1000);
}