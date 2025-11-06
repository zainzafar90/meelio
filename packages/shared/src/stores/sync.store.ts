import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type EntityType =
  | "note"
  | "task"
  | "pomodoro"
  | "focus-time"
  | "tab-stash"
  | "site-blocker";

export interface SyncOperation {
  id: string;
  entityType: EntityType;
  type: "create" | "update" | "delete";
  entityId: string;
  data?: any;
  retries: number;
}

export interface SyncState {
  queues: Record<string, SyncOperation[]>;
  isOnline: boolean;
  syncingEntities: Set<string>;
  lastSyncTimes: Record<string, number>;

  addToQueue: (
    entityType: EntityType,
    operation: Omit<SyncOperation, "id" | "retries" | "entityType">
  ) => void;
  removeFromQueue: (entityType: EntityType, operationId: string) => void;
  getQueue: (entityType: string) => SyncOperation[];
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncing: (entityType: string, isSyncing: boolean) => void;
  setLastSyncTime: (entityType: string, time: number) => void;
  incrementRetry: (entityType: string, operationId: string) => void;
  clearQueue: (entityType: string) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      queues: {},
      isOnline: navigator.onLine,
      syncingEntities: new Set(),
      lastSyncTimes: {},

      addToQueue: (entityType, operation) => {
        set((state) => ({
          queues: {
            ...state.queues,
            [entityType]: [
              ...(state.queues[entityType] || []),
              {
                ...operation,
                entityType,
                id: crypto.randomUUID(),
                retries: 0,
              },
            ],
          },
        }));
      },

      removeFromQueue: (entityType, operationId) => {
        set((state) => ({
          queues: {
            ...state.queues,
            [entityType]: (state.queues[entityType] || []).filter(
              (op) => op.id !== operationId
            ),
          },
        }));
      },

      getQueue: (entityType) => {
        return get().queues[entityType] || [];
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },

      setSyncing: (entityType, isSyncing) => {
        set((state) => {
          const newSyncingEntities = new Set(state.syncingEntities);
          if (isSyncing) {
            newSyncingEntities.add(entityType);
          } else {
            newSyncingEntities.delete(entityType);
          }
          return { syncingEntities: newSyncingEntities };
        });
      },

      setLastSyncTime: (entityType, time) => {
        set((state) => ({
          lastSyncTimes: {
            ...state.lastSyncTimes,
            [entityType]: time,
          },
        }));
      },

      incrementRetry: (entityType, operationId) => {
        set((state) => ({
          queues: {
            ...state.queues,
            [entityType]: (state.queues[entityType] || []).map((op) =>
              op.id === operationId ? { ...op, retries: op.retries + 1 } : op
            ),
          },
        }));
      },

      clearQueue: (entityType) => {
        set((state) => ({
          queues: {
            ...state.queues,
            [entityType]: [],
          },
        }));
      },
    }),
    {
      name: "meelio:local:sync",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        queues: state.queues,
        lastSyncTimes: state.lastSyncTimes,
      }),
    }
  )
);

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useSyncStore.getState().setOnlineStatus(true);
  });

  window.addEventListener("offline", () => {
    useSyncStore.getState().setOnlineStatus(false);
  });
}
