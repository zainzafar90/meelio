import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { useSyncStore } from "./sync.store";
import { siteBlockerApi } from "../api/site-blocker.api";

interface SiteBlockerState {
  blockedSites: string[];
  idMap: Record<string, string>; // url -> id
  addSite: (url: string) => Promise<void>;
  /**
   * Remove a site from the local list. If `sync` is true and the user is
   * authenticated the entry will also be deleted from the API.
   */
  removeSite: (url: string, sync?: boolean) => Promise<void>;
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
            idMap: { ...state.idMap, [url]: res.id },
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
      blockedSites: [],
      idMap: {},
      addSite: async (url) => {
        set((state) => ({
          blockedSites: Array.from(new Set([...state.blockedSites, url])),
        }));
        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (user) {
          if (syncStore.isOnline) {
            try {
              const res = await siteBlockerApi.addBlockedSite(url);
              set((state) => ({ idMap: { ...state.idMap, [url]: res.id } }));
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
        set((state) => ({
          blockedSites: state.blockedSites.filter((s) => s !== url),
        }));
        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (sync && user) {
          const id = get().idMap[url];
          if (id) {
            if (syncStore.isOnline) {
              try {
                await siteBlockerApi.removeBlockedSite(id);
              } catch (e) {
                console.error(e);
              }
            } else {
              syncStore.addToQueue("site-blocker", {
                type: "delete",
                entityId: id,
                data: { id },
              });
            }

            if (syncStore.isOnline) processSyncQueue();
          }
          set((state) => {
            const newMap = { ...state.idMap };
            delete newMap[url];
            return { idMap: newMap };
          });
        }
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
              blockedSites: sites.map((s) => s.url),
              idMap: Object.fromEntries(sites.map((s) => [s.url, s.id])),
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
        idMap: state.idMap,
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
