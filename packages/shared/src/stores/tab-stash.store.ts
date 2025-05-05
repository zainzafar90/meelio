import { create } from "zustand";

import { persist, createJSONStorage } from "zustand/middleware";
import { TabSession, TabStashState } from "../types/tab-stash.types";
import {
  checkTabPermissions,
  groupTabsByWindow,
  restoreTabsToWindow,
} from "../components/core/tab-stash/utils/tab-stash.utils";

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

      addSession: (session: TabSession) => {
        set((state) => ({
          sessions: [session, ...state.sessions],
        }));
      },

      removeSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter(
            (session) => session.id !== sessionId
          ),
        }));
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
