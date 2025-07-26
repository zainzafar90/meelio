import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { useSyncStore } from "./sync.store";
import { siteBlockerApi } from "../api/site-blocker.api";

interface SiteBlockState {
  id: string;
  url: string;
  isBlocked: boolean;
  blocked?: boolean; // @deprecated Use isBlocked instead
  streak: number;
  createdAt: number;
}

interface SiteBlockerState {
  sites: Record<string, SiteBlockState>;
  addSite: (url: string) => Promise<void>;
  removeSite: (url: string, sync?: boolean) => Promise<void>;
  toggleSite: (url: string) => Promise<void>;
  incrementStreak: (url: string) => void;
  loadFromServer: () => Promise<void>;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

function normalizeUrl(url: string): string {
  try {
    const normalized = new URL(url.includes("://") ? url : `https://${url}`);
    return normalized.hostname.replace(/^www\./, "");
  } catch {
    const match = url.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].replace(/^www\./, "") : url;
  }
}

function doesHostMatch(host: string, site: string): boolean {
  const normalizedHost = normalizeUrl(host);
  const normalizedSite = normalizeUrl(site);
  return (
    normalizedHost === normalizedSite ||
    normalizedHost.endsWith(`.${normalizedSite}`)
  );
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
          const normalizedUrl = normalizeUrl(url);
          const res = await siteBlockerApi.addBlockedSite(normalizedUrl);
          useSiteBlockerStore.setState((state) => ({
            sites: {
              ...state.sites,
              [res.id]: {
                id: res.id,
                url: normalizedUrl,
                isBlocked: true,
                blocked: true, // Keep for backward compatibility
                streak: 0,
                createdAt: Date.now(),
              },
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

// Migration function to convert old blocked field to isBlocked
function migrateSites(sites: Record<string, any>): Record<string, SiteBlockState> {
  const migrated: Record<string, SiteBlockState> = {};
  
  for (const [id, site] of Object.entries(sites)) {
    migrated[id] = {
      ...site,
      isBlocked: site.isBlocked !== undefined ? site.isBlocked : site.blocked ?? true,
      blocked: site.blocked, // Keep for backward compatibility
    };
  }
  
  return migrated;
}

export const useSiteBlockerStore = create<SiteBlockerState>()(
  persist(
    (set, get) => ({
      sites: {},
      addSite: async (url) => {
        const normalizedUrl = normalizeUrl(url);

        // Check if site already exists
        const existingSite = Object.values(get().sites).find((site) =>
          doesHostMatch(site.url, normalizedUrl)
        );

        if (existingSite) {
          const isCurrentlyBlocked = existingSite.isBlocked !== undefined ? existingSite.isBlocked : existingSite.blocked;
          if (!isCurrentlyBlocked) {
            set((state) => ({
              sites: {
                ...state.sites,
                [existingSite.id]: {
                  ...existingSite,
                  isBlocked: true,
                  blocked: true, // Keep for backward compatibility
                },
              },
            }));
          }
          return;
        }

        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (user) {
          if (syncStore.isOnline) {
            try {
              const res = await siteBlockerApi.addBlockedSite(normalizedUrl);
              set((state) => ({
                sites: {
                  ...state.sites,
                  [res.id]: {
                    id: res.id,
                    url: normalizedUrl,
                    isBlocked: true,
                    blocked: true, // Keep for backward compatibility
                    streak: 0,
                    createdAt: Date.now(),
                  },
                },
              }));
            } catch (e) {
              console.error(e);
              throw e; // Re-throw to allow UI to handle the error
            }
          } else {
            syncStore.addToQueue("site-blocker", {
              type: "create",
              entityId: normalizedUrl,
              data: { url: normalizedUrl },
            });
          }

          if (syncStore.isOnline) processSyncQueue();
        } else {
          // For non-authenticated users, use a local ID
          const localId = `local_${Date.now()}`;
          set((state) => ({
            sites: {
              ...state.sites,
              [localId]: {
                id: localId,
                url: normalizedUrl,
                isBlocked: true,
                blocked: true, // Keep for backward compatibility
                streak: 0,
                createdAt: Date.now(),
              },
            },
          }));
        }
      },
      removeSite: async (url, sync = true) => {
        const normalizedUrl = normalizeUrl(url);
        const site = Object.values(get().sites).find((s) =>
          doesHostMatch(s.url, normalizedUrl)
        );

        if (!site) return;

        set((state) => {
          const newSites = { ...state.sites };
          delete newSites[site.id];
          return { sites: newSites };
        });

        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (sync && user && !site.id.startsWith("local_")) {
          if (syncStore.isOnline) {
            try {
              await siteBlockerApi.removeBlockedSite(site.id);
            } catch (e) {
              console.error(e);
            }
          } else {
            syncStore.addToQueue("site-blocker", {
              type: "delete",
              entityId: site.id,
              data: { id: site.id },
            });
          }

          if (syncStore.isOnline) processSyncQueue();
        }
      },
      toggleSite: async (url) => {
        const normalizedUrl = normalizeUrl(url);
        const site = Object.values(get().sites).find((s) =>
          doesHostMatch(s.url, normalizedUrl)
        );

        const isCurrentlyBlocked = site ? (site.isBlocked !== undefined ? site.isBlocked : site.blocked) : false;
        if (isCurrentlyBlocked) {
          await get().removeSite(url);
        } else {
          await get().addSite(url);
        }
      },
      incrementStreak: (url) => {
        const normalizedUrl = normalizeUrl(url);
        const site = Object.values(get().sites).find((s) =>
          doesHostMatch(s.url, normalizedUrl)
        );

        if (!site) return;

        set((state) => ({
          sites: {
            ...state.sites,
            [site.id]: {
              ...site,
              streak: (site.streak || 0) + 1,
            },
          },
        }));
      },
      loadFromServer: async () => {
        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (!user || !user.isPro) return;

        if (syncStore.isOnline) {
          await processSyncQueue();
        }

        if (syncStore.isOnline) {
          try {
            const sites = await siteBlockerApi.getBlockedSites();
            set({
              sites: Object.fromEntries(
                sites.map((s) => [
                  s.id,
                  {
                    id: s.id,
                    url: normalizeUrl(s.url),
                    isBlocked: s.isBlocked !== undefined ? s.isBlocked : true,
                    blocked: true, // Keep for backward compatibility
                    streak: 0,
                    createdAt: Date.now(),
                  },
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
      version: 2, // Increment version for migration
      partialize: (state) => ({
        sites: state.sites,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          // Migrate from version 1 to 2
          return {
            ...persistedState,
            sites: migrateSites(persistedState.sites || {}),
          };
        }
        return persistedState;
      },
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
