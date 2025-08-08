/* eslint-disable no-unused-vars */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { siteBlockerApi } from "../api/site-blocker.api";
import { useSyncStore } from "./sync.store";
import { generateUUID } from "../utils/common.utils";

interface SiteBlockState {
  id: string;
  url: string;
  blocked: boolean;
  streak: number;
  createdAt: number;
}

interface SiteBlockerState {
  sites: Record<string, SiteBlockState>;
  addSite: (url: string, category?: string) => Promise<void>;
  removeSite: (url: string) => Promise<void>;
  toggleSite: (url: string) => Promise<void>;
  initializeStore: () => Promise<void>;
  syncWithServer: () => Promise<void>;
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

let isProcessingSyncQueue = false;

async function processSyncQueue() {
  if (isProcessingSyncQueue) return;

  const syncStore = useSyncStore.getState();
  const queue = syncStore.getQueue("site-blocker");
  const shouldSync = queue.length > 0 && syncStore.isOnline;
  if (!shouldSync) return;

  isProcessingSyncQueue = true;
  syncStore.setSyncing("site-blocker", true);

  const creates: Array<{ clientId?: string; url: string; category?: string }> = [];
  const deletes: Array<{ id?: string; clientId?: string }> = [];
  for (const op of queue) {
    if (op.type === "create") {
      creates.push({ clientId: op.entityId, url: op.data.url, category: op.data.category });
    } else if (op.type === "delete") {
      const id = op.entityId;
      if (id.startsWith("temp_")) {
        deletes.push({ clientId: id });
      } else {
        deletes.push({ id });
      }
    }
  }

  try {
    const result = await siteBlockerApi.bulkSync({ creates, deletes });
    const idMap = new Map<string, string>();
    for (const c of result.created) {
      if (c.clientId && c.id !== c.clientId) idMap.set(c.clientId, c.id);
    }

    // Reconcile local state ids
    useSiteBlockerStore.setState((state) => {
      const copy = { ...state.sites };
      for (const [clientId, serverId] of idMap) {
        const prev = copy[clientId];
        if (prev) {
          delete copy[clientId];
          copy[serverId] = { ...prev, id: serverId };
        }
      }
      // Remove deleted ids
      for (const deletedId of result.deleted) {
        if (copy[deletedId]) delete copy[deletedId];
      }
      return { sites: copy } as Partial<SiteBlockerState> as any;
    });

    // Clear queue upon success (use clear to avoid any stragglers)
    syncStore.clearQueue("site-blocker");
  } catch (error) {
    console.error("Site-blocker bulk sync failed:", error);
  }

  syncStore.setSyncing("site-blocker", false);
  syncStore.setLastSyncTime("site-blocker", Date.now());
  isProcessingSyncQueue = false;
}

export const useSiteBlockerStore = create<SiteBlockerState>()(
  persist(
    (set, get) => ({
      sites: {},
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addSite: async (url, category) => {
        const normalizedUrl = normalizeUrl(url);
        const existsBlocked = Object.values(get().sites).some(
          (s) => s.url === normalizedUrl && s.blocked
        );
        if (existsBlocked) return;

        const tempId = `temp_${generateUUID()}`;
        const createdAt = Date.now();
        set((state) => ({
          sites: {
            ...state.sites,
            [tempId]: {
              id: tempId,
              url: normalizedUrl,
              blocked: true,
              streak: 0,
              createdAt,
            },
          },
        }));

        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();
        if (user?.isPro) {
          syncStore.addToQueue("site-blocker", {
            type: "create",
            entityId: tempId,
            data: { url: normalizedUrl, category },
          });
          if (syncStore.isOnline) processSyncQueue();
        }
      },

      removeSite: async (url) => {
        const normalizedUrl = normalizeUrl(url);
        const entry = Object.values(get().sites).find(
          (s) => s.url === normalizedUrl && s.blocked
        );
        if (!entry) return;

        set((state) => {
          const copy = { ...state.sites };
          delete copy[entry.id];
          return { sites: copy };
        });

        const user = useAuthStore.getState().user;
        const syncStore = useSyncStore.getState();
        if (user?.isPro) {
          syncStore.addToQueue("site-blocker", {
            type: "delete",
            entityId: entry.id,
            data: {},
          });
          if (syncStore.isOnline) processSyncQueue();
        }
      },

      toggleSite: async (url) => {
        const normalizedUrl = normalizeUrl(url);
        const entry = Object.values(get().sites).find(
          (s) => s.url === normalizedUrl && s.blocked
        );
        if (entry) {
          await get().removeSite(url);
        } else {
          await get().addSite(url);
        }
      },

      initializeStore: async () => {
        const user = useAuthStore.getState().user;
        if (!user?.isPro) return;
        const syncStore = useSyncStore.getState();
        if (syncStore.isOnline) {
          await get().syncWithServer();
        }
      },

      syncWithServer: async () => {
        const user = useAuthStore.getState().user;
        if (!user?.isPro) return;
        const syncStore = useSyncStore.getState();
        try {
          await processSyncQueue();
          const server = await siteBlockerApi.getBlockedSites();
          if (!server || server.length === 0) {
            // Keep local if server has nothing
            syncStore.setLastSyncTime("site-blocker", Date.now());
            return;
          }
          const current = get().sites;
          const next = { ...current } as Record<string, SiteBlockState>;
          for (const s of server) {
            const normalized = normalizeUrl(s.url);
            const existing = Object.values(next).find((e) => e.url === normalized);
            if (existing) {
              if (existing.id !== s.id) {
                delete next[existing.id];
                next[s.id] = { ...existing, id: s.id, blocked: true };
              } else {
                next[s.id] = { ...existing, blocked: true };
              }
            } else {
              next[s.id] = {
                id: s.id,
                url: normalized,
                blocked: true,
                streak: 0,
                createdAt: Date.now(),
              };
            }
          }
          set({ sites: next });
          syncStore.setLastSyncTime("site-blocker", Date.now());
        } catch (e) {
          console.error("Site-blocker sync failed:", e);
          syncStore.setSyncing("site-blocker", false);
        }
      },
    }),
    {
      name: "meelio:local:site-blocker",
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const anyGlobal: any = typeof window !== "undefined" ? (window as any) : {};
          if (anyGlobal?.chrome?.storage?.local) {
            const result = await anyGlobal.chrome.storage.local.get(name);
            return result[name];
          }
          return null;
        },
        setItem: async (name, value) => {
          const anyGlobal: any = typeof window !== "undefined" ? (window as any) : {};
          if (anyGlobal?.chrome?.storage?.local) {
            await anyGlobal.chrome.storage.local.set({ [name]: value });
          }
        },
        removeItem: async (name) => {
          const anyGlobal: any = typeof window !== "undefined" ? (window as any) : {};
          if (anyGlobal?.chrome?.storage?.local) {
            await anyGlobal.chrome.storage.local.remove(name);
          }
        },
      })),
      version: 1,
      partialize: (state) => ({ sites: state.sites }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        const auth = useAuthStore.getState();
        if (auth?.user?.isPro) {
          state?.initializeStore?.();
        }
      },
    }
  )
);

// Kick a sync when auth store hydrates or when a user becomes Pro
try {
  let prevIsPro = !!useAuthStore.getState().user?.isPro;
  let prevHydrated = !!useAuthStore.getState()._hasHydrated;
  useAuthStore.subscribe((s) => {
    const currIsPro = !!s.user?.isPro;
    const currHydrated = !!s._hasHydrated;
    const becameReady = currHydrated && (!prevHydrated || currIsPro !== prevIsPro);
    prevIsPro = currIsPro;
    prevHydrated = currHydrated;
    if (becameReady && currIsPro) {
      const blocker = useSiteBlockerStore.getState();
      blocker.initializeStore();
    }
  });
} catch (err) {
  // ignore subscription issues in non-browser contexts
}
