import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface TabSession {
  id: string;
  name: string;
  timestamp: number;
  tabs: {
    title: string;
    url: string;
    favicon?: string;
    windowId: number;
    pinned: boolean;
  }[];
  windowCount: number;
}

interface TabStashState {
  sessions: TabSession[];
  hasPermissions: boolean;
  addSession: (session: TabSession) => void;
  removeSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newName: string) => void;
  restoreSession: (sessionId: string) => Promise<void>;
  clearAllSessions: () => void;
  loadSessions: () => Promise<void>;
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
}

export const useTabStashStore = create<TabStashState>()(
  persist(
    (set, get) => ({
      sessions: [],
      hasPermissions: false,

      addSession: (session) => {
        set((state) => {
          const newSessions = [session, ...state.sessions];
          return { sessions: newSessions };
        });
      },

      removeSession: (sessionId) => {
        set((state) => {
          const newSessions = state.sessions.filter(
            (session) => session.id !== sessionId
          );
          return { sessions: newSessions };
        });
      },

      renameSession: (sessionId, newName) => {
        set((state) => {
          const newSessions = state.sessions.map((session) =>
            session.id === sessionId ? { ...session, name: newName } : session
          );
          return { sessions: newSessions };
        });
      },

      restoreSession: async (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;

        try {
          const hasPermissions = await chrome.permissions.contains({
            permissions: ["tabs"],
          });

          if (!hasPermissions) {
            const granted = await chrome.permissions.request({
              permissions: ["tabs"],
            });
            if (!granted) {
              throw new Error("Required permissions not granted");
            }
          }

          const tabsByWindow = session.tabs.reduce(
            (acc, tab) => {
              if (!acc[tab.windowId]) {
                acc[tab.windowId] = [];
              }
              acc[tab.windowId].push(tab);
              return acc;
            },
            {} as Record<number, typeof session.tabs>
          );

          // Create each window with its tabs
          for (const tabs of Object.values(tabsByWindow)) {
            const window = await chrome.windows.create({
              url: tabs.map((tab) => tab.url),
              focused: true,
            });

            // Set pinned state for tabs that were pinned
            if (window.tabs) {
              const pinnedTabs = tabs.filter((tab) => tab.pinned);
              for (let i = 0; i < window.tabs.length; i++) {
                const originalTab = tabs[i];
                if (originalTab?.pinned) {
                  await chrome.tabs.update(window.tabs[i].id!, {
                    pinned: true,
                  });
                }
              }
            }
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
        const hasPermissions = await chrome.permissions.contains({
          permissions: ["tabs"],
        });
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
      }),
    }
  )
);
