import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import { PomodoroStage, PomodoroState } from '../types/pomodoro';
import { db } from '../lib/db/meelio.dexie';
import { useSyncStore } from './sync.store';
import { generateUUID } from '../utils/common.utils';

// Check if we're in a Chrome extension environment
const isExtension = typeof window !== 'undefined' && 
  typeof (window as any).chrome !== 'undefined' && 
  typeof (window as any).chrome.runtime !== 'undefined' &&
  typeof (window as any).chrome.runtime.id !== 'undefined';

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
        const syncStore = useSyncStore.getState();
        
        const sessionId = generateUUID();
        const session = {
          id: sessionId,
          timestamp: Date.now(),
          stage: state.activeStage === PomodoroStage.Focus ? 0 : 1,
          duration: state.stageDurations[state.activeStage],
          completed: true,
        };
        
        // Store in IndexedDB with proper ID handling
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
      // Conditionally include partialize based on platform
      ...(isExtension ? {
        // Extension-specific: partialize to save specific fields
        partialize: (state) => ({
          id: state.id,
          stats: state.stats,
          activeStage: state.activeStage,
          isRunning: state.isRunning,
          autoStartTimers: state.autoStartTimers,
          endTimestamp: state.endTimestamp,
        }),
      } : {})
    }
  )
);

// Auto-sync every 10 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    const syncStore = useSyncStore.getState();
    if (syncStore.isOnline && !syncStore.syncingEntities.has("pomodoro")) {
      usePomodoroStore.getState().syncSessions();
    }
  }, 10 * 60 * 1000);
}