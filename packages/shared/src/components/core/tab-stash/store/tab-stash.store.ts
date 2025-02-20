import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { TabStashState } from "../../../../types/tab-stash.types";
import {
  checkTabPermissions,
  groupTabsByWindow,
  restoreTabsToWindow,
} from "../utils/tab-stash.utils";

export const useTabStashStore = create<TabStashState>()(
  persist(
    (set, get) => ({
      sessions: [],
      hasPermissions: false,

      addSession: (session) => {
        set((state) => ({
          sessions: [session, ...state.sessions],
        }));
      },

      removeSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter(
            (session) => session.id !== sessionId
          ),
        }));
      },

      renameSession: (sessionId, newName) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, name: newName } : session
          ),
        }));
      },

      restoreSession: async (sessionId) => {
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
      version: 1,
      partialize: (state) => ({
        sessions: state.sessions,
        hasPermissions: state.hasPermissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkPermissions();
        }
      },
    }
  )
);
