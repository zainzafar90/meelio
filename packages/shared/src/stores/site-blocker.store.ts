import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { useSyncStore } from "./sync.store";
import { lwwMergeById } from "../utils/sync.utils";
import { siteBlockerApi } from "../api/site-blocker.api";

interface SiteBlockState {
  id: string;
  url: string;
  blocked: boolean;
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

  const creates: any[] = [];
  const deletes: any[] = [];
  for (const op of queue) {
    if (op.type === "create") {
      const url = normalizeUrl(op.data.url as string);
      creates.push({ clientId: op.entityId, url });
    } else if (op.type === "delete") {
      deletes.push({ id: op.entityId });
    }
  }

  try {
    const result = await siteBlockerApi.bulkSync({ creates, deletes });
    const idMap = new Map<string, string>();
    for (const c of result.created) {
      if ((c as any).clientId && c.id !== (c as any).clientId) idMap.set((c as any).clientId as string, c.id);
    }
    useSiteBlockerStore.setState((state) => ({
      sites: Object.fromEntries(
        Object.values(state.sites).map((s) => {
          const mapped = idMap.get(s.id);
          if (mapped) {
            return [mapped, { ...s, id: mapped }];
          }
          return [s.id, s];
        })
      ),
    }));
    for (const op of queue) syncStore.removeFromQueue("site-blocker", op.id);
  } catch (error) {
    console.error("Site blocker bulk sync failed:", error);
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
      sites: {},
      addSite: async (url) => {
        const normalizedUrl = normalizeUrl(url);

        // Check if site already exists
        const existingSite = Object.values(get().sites).find((site) =>
          doesHostMatch(site.url, normalizedUrl)
        );

        if (existingSite) {
          if (!existingSite.blocked) {
            set((state) => ({
              sites: {
                ...state.sites,
                [existingSite.id]: {
                  ...existingSite,
                  blocked: true,
                },
              },
            }));
          }
          return;
        }

        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();

        if (user) {
          const tempId = `temp_${Date.now()}`;
          set((state) => ({
            sites: {
              ...state.sites,
              [tempId]: {
                id: tempId,
                url: normalizedUrl,
                blocked: true,
                streak: 0,
                createdAt: Date.now(),
              },
            },
          }));
          syncStore.addToQueue("site-blocker", {
            type: "create",
            entityId: tempId,
            data: { url: normalizedUrl },
          });
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
                blocked: true,
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

        if (site?.blocked) {
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
            // Merge remote with local in case of offline additions
            const localArray = Object.values(get().sites);
            const remoteArray = sites.map((s) => ({
              id: s.id,
              url: normalizeUrl(s.url),
              blocked: true,
              streak: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }));
            const merged = lwwMergeById(
              localArray.map((s) => ({ ...s, updatedAt: s.createdAt })),
              remoteArray
            );
            set({
              sites: Object.fromEntries(merged.map((m) => [m.id, m])),
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
        sites: state.sites,
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
