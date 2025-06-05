import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { useSyncStore } from "./sync.store";
import { siteBlockerApi } from "../api/site-blocker.api";

interface SiteBlockState {
  siteId: string;
  blocked: boolean;
  streak: number;
}

interface SiteBlockerState {
  blockedSites: Record<string, SiteBlockState>;
  addSite: (url: string) => Promise<void>;
  removeSite: (url: string, sync?: boolean) => Promise<void>;
  toggleSite: (url: string) => Promise<void>;
  incrementStreak: (url: string) => void;
  loadFromServer: () => Promise<void>;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

async function processSyncQueue() {
  const syncStore = useSyncStore.getState();
  const queue = syncStore.getQueue("site-blocker");

  if (queue.length === 0 || !syncStore.isOnline) return;

  syncStore.setSyncing("site-blocker", true);

  for (const operation of queue) {
    try {
      switch (operation.type) {
        case "create": {
          const url = operation.data.url as string;
          const res = await siteBlockerApi.addBlockedSite(url);
          useSiteBlockerStore.setState((state) => ({
            blockedSites: {
              ...state.blockedSites,
              [url]: { ...state.blockedSites[url], siteId: res.id },
            },
          }));
          break;
        }
        case "delete": {
          const id = operation.data.id as string;
          await siteBlockerApi.removeBlockedSite(id);
          break;
        }
      }

      syncStore.removeFromQueue("site-blocker", operation.id);
    } catch (error) {
      console.error("Site blocker sync failed:", error);
      if (operation.retries >= 3) {
        syncStore.removeFromQueue("site-blocker", operation.id);
      } else {
        syncStore.incrementRetry("site-blocker", operation.id);
      }
    }
  }

  syncStore.setSyncing("site-blocker", false);
  syncStore.setLastSyncTime("site-blocker", Date.now());
}

let autoSyncInterval: NodeJS.Timeout | null = null;
function startAutoSync() {
  if (autoSyncInterval) clearInterval(autoSyncInterval);
  autoSyncInterval = setInterval(() => processSyncQueue(), 5 * 60 * 1000);
}

export const useSiteBlockerStore = create<SiteBlockerState>()(
  persist(
    (set, get) => ({
      blockedSites: {},
      addSite: async (url) => {
        set((state) => ({
          blockedSites: {
            ...state.blockedSites,
            [url]: { siteId: url, blocked: true, streak: 0 },
          },
        }));
        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (user) {
          if (syncStore.isOnline) {
            try {
              const res = await siteBlockerApi.addBlockedSite(url);
              set((state) => ({
                blockedSites: {
                  ...state.blockedSites,
                  [url]: { ...state.blockedSites[url], siteId: res.id },
                },
              }));
            } catch (e) {
              console.error(e);
            }
          } else {
            syncStore.addToQueue("site-blocker", {
              type: "create",
              entityId: url,
              data: { url },
            });
          }

          if (syncStore.isOnline) processSyncQueue();
        }
      },
      removeSite: async (url, sync = true) => {
        set((state) => {
          const newBlockedSites = { ...state.blockedSites };
          delete newBlockedSites[url];
          return { blockedSites: newBlockedSites };
        });

        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (sync && user) {
          const siteState = get().blockedSites[url];
          if (siteState?.siteId) {
            if (syncStore.isOnline) {
              try {
                await siteBlockerApi.removeBlockedSite(siteState.siteId);
              } catch (e) {
                console.error(e);
              }
            } else {
              syncStore.addToQueue("site-blocker", {
                type: "delete",
                entityId: siteState.siteId,
                data: { id: siteState.siteId },
              });
            }

            if (syncStore.isOnline) processSyncQueue();
          }
        }
      },
      toggleSite: async (url) => {
        const currentState = get().blockedSites[url];
        if (currentState?.blocked) {
          await get().removeSite(url);
        } else {
          await get().addSite(url);
        }
      },
      incrementStreak: (url) => {
        set((state) => {
          const siteState = state.blockedSites[url];
          if (!siteState) return state;

          return {
            blockedSites: {
              ...state.blockedSites,
              [url]: {
                ...siteState,
                streak: (siteState.streak || 0) + 1,
              },
            },
          };
        });
      },
      loadFromServer: async () => {
        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (!user) return;

        if (syncStore.isOnline) {
          await processSyncQueue();
        }

        if (syncStore.isOnline) {
          try {
            const sites = await siteBlockerApi.getBlockedSites();
            set({
              blockedSites: Object.fromEntries(
                sites.map((s) => [
                  s.url,
                  { siteId: s.id, blocked: true, streak: 0 },
                ])
              ),
            });
          } catch (e) {
            console.error(e);
          }
        }
        startAutoSync();
      },
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "meelio:local:site-blocker",
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
        blockedSites: state.blockedSites,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        const user = useAuthStore.getState().user;
        if (user) {
          state?.loadFromServer();
        }
      },
    }
  )
);
