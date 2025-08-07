import { create } from "zustand";

import { persist, createJSONStorage } from "zustand/middleware";
import { TabSession, TabStashState } from "../types/tab-stash.types";
import { lwwMergeById } from "../utils/sync.utils";
import { useAuthStore } from "./auth.store";
import { useSyncStore } from "./sync.store";
import { tabStashService } from "../services/tab-stash.service";
import {
  checkTabPermissions,
  groupTabsByWindow,
  restoreTabsToWindow,
} from "../components/core/tab-stash/utils/tab-stash.utils";

async function processSyncQueue() {
  const syncStore = useSyncStore.getState();
  const queue = syncStore.getQueue("tab-stash");

  if (queue.length === 0 || !syncStore.isOnline) return;

  syncStore.setSyncing("tab-stash", true);

  const creates: any[] = [];
  const updates: any[] = [];
  const deletes: any[] = [];
  for (const op of queue) {
    if (op.type === "create") {
      const session = op.data.session as TabSession;
      creates.push({ clientId: session.id, windowId: session.id, urls: session.tabs.map((t) => t.url) });
    } else if (op.type === "update") {
      // not used yet
    } else if (op.type === "delete") {
      deletes.push({ id: op.entityId });
    }
  }

  try {
    const result = await tabStashService.bulkSync({ creates, updates, deletes });
    const idMap = new Map<string, string>();
    for (const c of result.created) {
      if (c.clientId && c.id !== c.clientId) idMap.set(c.clientId, c.id);
    }
    useTabStashStore.setState((state) => ({
      sessions: state.sessions.map((s) => (idMap.has(s.id) ? { ...s, id: idMap.get(s.id)! } : s)),
    }));
    for (const op of queue) syncStore.removeFromQueue("tab-stash", op.id);
  } catch (error) {
    console.error("Tab stash bulk sync failed:", error);
  }

  syncStore.setSyncing("tab-stash", false);
  syncStore.setLastSyncTime("tab-stash", Date.now());
}

let autoSyncInterval: NodeJS.Timeout | null = null;
function startAutoSync() {
  if (autoSyncInterval) clearInterval(autoSyncInterval);
  autoSyncInterval = setInterval(() => processSyncQueue(), 5 * 60 * 1000);
}

export const useTabStashStore = create<TabStashState>()(
  persist(
    (set, get) => ({
      sessions: [],
      hasPermissions: false,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },

      addSession: async (session: TabSession) => {
        const authUser = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        set((state) => ({
          sessions: [session, ...state.sessions],
        }));

        if (authUser) {
          syncStore.addToQueue("tab-stash", {
            type: "create",
            entityId: session.id,
            data: { session },
          });
          if (syncStore.isOnline) processSyncQueue();
        }
      },

      removeSession: async (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter(
            (session) => session.id !== sessionId
          ),
        }));

        const authUser = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (authUser) {
          syncStore.addToQueue("tab-stash", {
            type: "delete",
            entityId: sessionId,
          });
          if (syncStore.isOnline) processSyncQueue();
        }
      },

      updateSession: (session: TabSession) => {
        console.warn("updateSession not implemented", session);
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === session.id ? session : s
          ),
        }));
      },

      renameSession: (sessionId: string, newName: string) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, name: newName } : session
          ),
        }));
      },

      restoreSession: async (sessionId: string) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;

        try {
          const hasPermissions = await checkTabPermissions();
          if (!hasPermissions) {
            const granted = await chrome.permissions.request({
              permissions: ["tabs"],
            });
            if (!granted) {
              throw new Error("Required permissions not granted");
            }
            set({ hasPermissions: true });
          }

          const tabsByWindow = groupTabsByWindow(session.tabs);

          // Create each window with its tabs
          for (const tabs of Object.values(tabsByWindow)) {
            await restoreTabsToWindow(tabs);
          }
        } catch (error) {
          console.error("Error restoring session:", error);
          throw error;
        }
      },

      removeTabFromSession: (sessionId: string, tabId: number) => {
        console.warn("removeTabFromSession not implemented", sessionId, tabId);
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  tabs: session.tabs.filter((tab) => tab.id !== tabId),
                }
              : session
          ),
        }));
      },

      clearAllSessions: () => {
        set({ sessions: [] });
      },

      checkPermissions: async () => {
        const hasPermissions = await checkTabPermissions();
        set({ hasPermissions });
        return hasPermissions;
      },

      requestPermissions: async () => {
        const granted = await chrome.permissions.request({
          permissions: ["tabs"],
        });
        set({ hasPermissions: granted });
        return granted;
      },

      loadSessions: async () => {
        await get().checkPermissions();

        const authUser = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (authUser) {
          if (syncStore.isOnline) {
            await processSyncQueue();
          }

          if (syncStore.isOnline) {
            try {
              const remote = await tabStashService.getTabStashes();
              const remoteSessions: TabSession[] = remote.map((r) => ({
                id: r.id,
                name: new Date(r.createdAt).toLocaleString(),
                timestamp: new Date(r.createdAt).getTime(),
                windowCount: 1,
                tabs: r.urls.map((url) => ({
                  title: url,
                  url,
                  windowId: parseInt(r.windowId) || 0,
                  pinned: false,
                })),
              }));
              const merged = lwwMergeById(
                get().sessions.map((s) => ({ ...s, updatedAt: s.timestamp })),
                remoteSessions.map((s) => ({ ...s, updatedAt: s.timestamp }))
              );
              set({ sessions: merged });
              return;
            } catch (error) {
              console.error("Failed to load sessions from server:", error);
            }
          }
          startAutoSync();
        }

        if (!chrome?.storage?.local) return;

        try {
          const result = await chrome.storage.local.get("tabSessions");
          if (result.tabSessions) {
            set({ sessions: result.tabSessions });
          }
        } catch (error) {
          console.error("Error loading sessions:", error);
        }
      },
    }),
    {
      name: "tab-stash-storage",
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          if (chrome?.storage?.local) {
            const result = await chrome.storage.local.get(name);
            return result[name];
          }
          return null;
        },
        setItem: async (name, value) => {
          if (chrome?.storage?.local) {
            await chrome.storage.local.set({ [name]: value });
          }
        },
        removeItem: async (name) => {
          if (chrome?.storage?.local) {
            await chrome.storage.local.remove(name);
          }
        },
      })),
      version: 2,
      partialize: (state) => ({
        sessions: state.sessions,
        hasPermissions: state.hasPermissions,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state) {
          state.checkPermissions();
        }
      },
    }
  )
);
