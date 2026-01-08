import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import { db } from "../lib/db/meelio.dexie";
import type { TabStash } from "../lib/db/models.dexie";
import { useAuthStore } from "./auth.store";
import { generateUUID } from "../utils/common.utils";
import type { TabSession } from "../types/tab-stash.types";
import {
  checkTabPermissions,
  groupTabsByWindow,
  restoreTabsToWindowWithGroups,
  restoreTabsToExistingWindow,
} from "../components/core/tab-stash/utils/tab-stash.utils";

interface TabStashState {
  sessions: TabSession[];
  hasPermissions: boolean;
  isLoading: boolean;
  error: string | null;

  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;

  addSession: (session: TabSession) => Promise<TabStash | undefined>;
  removeSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newName: string) => void;
  restoreSession: (sessionId: string) => Promise<void>;

  clearAllSessions: () => void;
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
}

let initializationPromise: Promise<void> | null = null;

export const useTabStashStore = create<TabStashState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        sessions: [],
        hasPermissions: false,
        isLoading: false,
        error: null,

        initializeStore: async () => {
          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;

          if (!userId) return;

          if (initializationPromise) {
            return initializationPromise;
          }

          initializationPromise = (async () => {
            try {
              set({ isLoading: true, error: null });
              await get().checkPermissions();
              await get().loadFromLocal();
            } catch (error: any) {
              console.error("Failed to initialize tab stash store:", error);
              set({ error: error?.message || "Failed to initialize store" });
            } finally {
              set({ isLoading: false });
              initializationPromise = null;
            }
          })();

          return initializationPromise;
        },

        loadFromLocal: async () => {
          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;

          if (!userId) return;

          const localTabStashes = await db.tabStashes
            .where("userId")
            .equals(userId)
            .toArray();

          const sessions: TabSession[] = localTabStashes
            .filter(ts => !ts.deletedAt)
            .map(ts => ({
              id: ts.id,
              name: new Date(ts.createdAt).toLocaleString(),
              timestamp: ts.updatedAt || ts.createdAt,
              windowCount: 1,
              tabs: ts.tabsData && ts.tabsData.length > 0
                ? ts.tabsData.map(tab => ({
                  title: tab.title,
                  url: tab.url,
                  favicon: tab.favicon,
                  windowId: tab.windowId,
                  pinned: tab.pinned,
                  groupId: tab.groupId,
                  groupData: tab.groupData,
                }))
                : ts.urls.map(url => ({
                  title: url,
                  url,
                  windowId: parseInt(ts.windowId) || 0,
                  pinned: false,
                })),
            }));

          set({ sessions });
        },

        addSession: async (session: TabSession) => {
          const MAX_TAB_STASHES = 100;

          if (get().sessions.length >= MAX_TAB_STASHES) {
            return undefined;
          }

          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;
          if (!userId) return;

          const now = Date.now();
          const id = session.id || generateUUID();

          const tabStash: TabStash = {
            id,
            userId,
            windowId: id,
            urls: session.tabs.map(t => t.url),
            tabsData: session.tabs.map(t => ({
              title: t.title,
              url: t.url,
              favicon: t.favicon,
              windowId: t.windowId,
              pinned: t.pinned,
              groupId: t.groupId,
              groupData: t.groupData,
            })),
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          };

          try {
            await db.tabStashes.add(tabStash);

            const newSession: TabSession = {
              ...session,
              id,
              timestamp: now,
            };
            set(s => ({ sessions: [newSession, ...s.sessions] }));

            return tabStash;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to add tab stash",
            });
            return undefined;
          }
        },

        removeSession: async (sessionId: string) => {
          try {
            const deletedAt = Date.now();
            await db.tabStashes.update(sessionId, { deletedAt, updatedAt: deletedAt });
            set(s => ({ sessions: s.sessions.filter(session => session.id !== sessionId) }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to delete tab stash",
            });
          }
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
                permissions: ["tabs", "tabGroups"],
              });
              if (!granted) {
                throw new Error("Required permissions not granted");
              }
              set({ hasPermissions: true });
            }

            const currentWindow = await chrome.windows.getCurrent();

            const tabsByWindow = groupTabsByWindow(session.tabs);
            const windowGroups = Object.entries(tabsByWindow).sort(([a], [b]) => parseInt(a) - parseInt(b));

            if (windowGroups.length === 0) return;

            const [, firstWindowTabs] = windowGroups[0];
            await restoreTabsToExistingWindow(currentWindow.id!, firstWindowTabs);

            for (let i = 1; i < windowGroups.length; i++) {
              const [, tabs] = windowGroups[i];
              await restoreTabsToWindowWithGroups(tabs);
            }

          } catch (error) {
            console.error("Error restoring session:", error);
            throw error;
          }
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
            permissions: ["tabs", "tabGroups"],
          });
          set({ hasPermissions: granted });
          return granted;
        },
      }),
      {
        name: "meelio:local:tab-stash",
        version: 1,
        storage: createJSONStorage(() => {
          if (typeof chrome !== "undefined" && chrome?.storage?.local) {
            return {
              getItem: async (name) => {
                const result = await chrome.storage.local.get(name);
                return result[name];
              },
              setItem: async (name, value) => {
                await chrome.storage.local.set({ [name]: value });
              },
              removeItem: async (name) => {
                await chrome.storage.local.remove(name);
              },
            };
          }
          return localStorage;
        }),
        partialize: (s) => ({ hasPermissions: s.hasPermissions }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.checkPermissions();
          }
        },
      }
    )
  )
);
