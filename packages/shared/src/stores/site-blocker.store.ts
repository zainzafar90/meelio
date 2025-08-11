import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import { db } from "../lib/db/meelio.dexie";
import type { SiteBlocker } from "../lib/db/models.dexie";
import { useAuthStore } from "./auth.store";
import { SyncState, useSyncStore } from "./sync.store";
import { EntitySyncManager, createEntitySync } from "../utils/sync-core";
import { createAdapter, normalizeDates } from "../utils/sync-adapters";
import { siteBlockerApi } from "../api/site-blocker.api";
import { generateUUID } from "../utils/common.utils";

interface SiteBlockerState {
  sites: SiteBlocker[];
  isLoading: boolean;
  error: string | null;

  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncWithServer: () => Promise<void>;

  addSite: (url: string, category?: string) => Promise<SiteBlocker | undefined>;
  toggleSite: (url: string) => Promise<void>;
  removeSite: (url: string) => Promise<void>;
  bulkAddSites: (urls: string[], category?: string) => Promise<void>;
  bulkRemoveSites: (urls: string[]) => Promise<void>;

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

let siteBlockerSyncManager: EntitySyncManager<SiteBlocker, any, any, any, any> | null = null;
let isInitializing = false;

function normalizeUrl(url: string): string {
  try {
    const normalized = new URL(url.includes("://") ? url : `https://${url}`);
    return normalized.hostname.replace(/^www\./, "");
  } catch {
    const match = url.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].replace(/^www\./, "") : url;
  }
}

export const useSiteBlockerStore = create<SiteBlockerState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        sites: [],
        isLoading: false,
        error: null,
        _hasHydrated: false,

        setHasHydrated: (state) => {
          set({ _hasHydrated: state });
        },

        initializeStore: async () => {
          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;

          if (!userId) return;

          if (isInitializing) {
            return;
          }

          isInitializing = true;

          try {
            set({ isLoading: true, error: null });

            await get().loadFromLocal();

            if (user?.isPro) {
              const syncStore = useSyncStore.getState();
              if (syncStore.isOnline) {
                await get().syncWithServer();
              }
            }
          } catch (error: any) {
            console.error("Failed to initialize site blocker store:", error);
            set({ error: error?.message || "Failed to initialize store" });
          } finally {
            set({ isLoading: false });
            isInitializing = false;
          }
        },

        loadFromLocal: async () => {
          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;

          if (!userId) return;

          // Load from IndexedDB
          const localSiteBlockers = await db.siteBlocker
            .where("userId")
            .equals(userId)
            .toArray();

          // Check if we need to migrate from Chrome storage to IndexedDB
          const currentState = get();
          if (currentState.sites.length > 0 && localSiteBlockers.length === 0) {
            // Migrate existing sites from Chrome storage to IndexedDB
            console.log("Migrating site blockers from Chrome storage to IndexedDB");
            for (const site of currentState.sites) {
              try {
                // Ensure the site has proper userId
                const siteWithUser = { ...site, userId };
                await db.siteBlocker.add(siteWithUser);
              } catch (err) {
                console.warn("Failed to migrate site:", site.url, err);
              }
            }
            // Re-read from IndexedDB after migration
            const migratedSites = await db.siteBlocker
              .where("userId")
              .equals(userId)
              .toArray();
            set({
              sites: migratedSites.filter(s => !s.deletedAt),
            });
          } else {
            // Normal load from IndexedDB
            set({
              sites: localSiteBlockers.filter(s => !s.deletedAt),
            });
          }
        },

        syncWithServer: async () => {
          if (!siteBlockerSyncManager) return;
          await siteBlockerSyncManager.syncWithServer();
        },

        addSite: async (url, category) => {
          const MAX_SITE_BLOCKERS = 500;
          const normalizedUrl = normalizeUrl(url);
          
          // Check if already exists
          const existing = get().sites.find(s => s.url === normalizedUrl);
          if (existing && existing.isBlocked) {
            return existing;
          }

          if (get().sites.filter(s => s.isBlocked).length >= MAX_SITE_BLOCKERS) {
            return undefined;
          }

          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;
          if (!userId) return;

          const syncStore = useSyncStore.getState();
          const now = Date.now();
          const id = generateUUID();

          const siteBlocker: SiteBlocker = {
            id,
            userId,
            url: normalizedUrl,
            category: category || undefined,
            isBlocked: true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          };

          try {
            // If site exists but not blocked, update it
            if (existing) {
              await db.siteBlocker.update(existing.id, {
                isBlocked: true,
                updatedAt: now,
                deletedAt: null,
              });

              set(s => ({
                sites: s.sites.map(site =>
                  site.id === existing.id
                    ? { ...site, isBlocked: true, updatedAt: now, deletedAt: null }
                    : site
                ),
              }));

              // Only sync for Pro users
              if (user?.isPro) {
                syncStore.addToQueue("site-blocker", {
                  type: "update",
                  entityId: existing.id,
                  data: { isBlocked: true, updatedAt: now, deletedAt: null },
                });

                if (syncStore.isOnline && siteBlockerSyncManager) {
                  siteBlockerSyncManager.processQueue();
                }
              }

              return { ...existing, isBlocked: true, updatedAt: now };
            }

            // Create new site blocker
            await db.siteBlocker.add(siteBlocker);
            set(s => ({ sites: [...s.sites, siteBlocker] }));

            // Only sync for Pro users
            if (user?.isPro) {
              syncStore.addToQueue("site-blocker", {
                type: "create",
                entityId: id,
                data: siteBlocker,
              });

              if (syncStore.isOnline && siteBlockerSyncManager) {
                siteBlockerSyncManager.processQueue();
              }
            }

            return siteBlocker;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to add site",
            });
            return undefined;
          }
        },

        toggleSite: async (url) => {
          const normalizedUrl = normalizeUrl(url);
          const site = get().sites.find(s => s.url === normalizedUrl);
          
          if (!site) {
            // Create new blocked site
            await get().addSite(url);
            return;
          }

          const authState = useAuthStore.getState();
          const user = authState.user;
          const syncStore = useSyncStore.getState();
          const updatedData = { isBlocked: !site.isBlocked, updatedAt: Date.now() };

          try {
            await db.siteBlocker.update(site.id, updatedData);

            set(state => ({
              sites: state.sites.map(s =>
                s.id === site.id ? { ...s, ...updatedData } : s
              ),
            }));

            // Only sync for Pro users
            if (user?.isPro) {
              syncStore.addToQueue("site-blocker", {
                type: "update",
                entityId: site.id,
                data: updatedData,
              });

              if (syncStore.isOnline && siteBlockerSyncManager) {
                siteBlockerSyncManager.processQueue();
              }
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to toggle site",
            });
          }
        },

        removeSite: async (url) => {
          const normalizedUrl = normalizeUrl(url);
          const site = get().sites.find(s => s.url === normalizedUrl && s.isBlocked);
          if (!site) return;

          const authState = useAuthStore.getState();
          const user = authState.user;
          const syncStore = useSyncStore.getState();

          try {
            const deletedAt = Date.now();
            // Soft delete locally (tombstone)
            await db.siteBlocker.update(site.id, { deletedAt, updatedAt: deletedAt });

            set(s => ({ sites: s.sites.filter(sb => sb.id !== site.id) }));

            // Only sync for Pro users
            if (user?.isPro) {
              syncStore.addToQueue("site-blocker", {
                type: "delete",
                entityId: site.id,
                data: { deletedAt },
              });

              if (syncStore.isOnline && siteBlockerSyncManager) {
                siteBlockerSyncManager.processQueue();
              }
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to remove site",
            });
          }
        },

        bulkAddSites: async (urls, category) => {
          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;
          if (!userId) return;

          const syncStore = useSyncStore.getState();
          const normalizedUrls = urls.map(normalizeUrl);
          const currentSites = get().sites;
          const now = Date.now();

          // Separate existing unblocked sites from new sites
          const toUpdate: SiteBlocker[] = [];
          const toCreate: SiteBlocker[] = [];

          for (const url of normalizedUrls) {
            const existing = currentSites.find(s => s.url === url);
            if (existing) {
              if (!existing.isBlocked) {
                toUpdate.push({ ...existing, isBlocked: true, updatedAt: now });
              }
            } else {
              toCreate.push({
                id: generateUUID(),
                userId,
                url,
                category: category || undefined,
                isBlocked: true,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
              });
            }
          }

          if (toUpdate.length === 0 && toCreate.length === 0) return;

          try {
            // Update existing sites
            for (const site of toUpdate) {
              await db.siteBlocker.update(site.id, {
                isBlocked: true,
                updatedAt: now,
                deletedAt: null,
              });
            }

            // Create new sites
            for (const site of toCreate) {
              await db.siteBlocker.add(site);
            }

            // Update state
            set(state => ({
              sites: [
                ...state.sites.map(s => {
                  const updated = toUpdate.find(u => u.id === s.id);
                  return updated || s;
                }),
                ...toCreate,
              ],
            }));

            // Only sync for Pro users
            if (user?.isPro) {
              for (const site of toUpdate) {
                syncStore.addToQueue("site-blocker", {
                  type: "update",
                  entityId: site.id,
                  data: { isBlocked: true, updatedAt: now },
                });
              }

              for (const site of toCreate) {
                syncStore.addToQueue("site-blocker", {
                  type: "create",
                  entityId: site.id,
                  data: site,
                });
              }

              if (syncStore.isOnline && siteBlockerSyncManager) {
                siteBlockerSyncManager.processQueue();
              }
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to bulk add sites",
            });
          }
        },

        bulkRemoveSites: async (urls) => {
          const authState = useAuthStore.getState();
          const user = authState.user;
          const syncStore = useSyncStore.getState();
          const normalizedUrls = urls.map(normalizeUrl);
          const toRemove = get().sites.filter(s => normalizedUrls.includes(s.url) && s.isBlocked);

          if (toRemove.length === 0) return;

          try {
            const deletedAt = Date.now();

            // Soft delete all sites
            for (const site of toRemove) {
              await db.siteBlocker.update(site.id, { deletedAt, updatedAt: deletedAt });
            }

            set(state => ({
              sites: state.sites.filter(s => !toRemove.some(r => r.id === s.id)),
            }));

            // Only sync for Pro users
            if (user?.isPro) {
              for (const site of toRemove) {
                syncStore.addToQueue("site-blocker", {
                  type: "delete",
                  entityId: site.id,
                  data: { deletedAt },
                });
              }

              if (syncStore.isOnline && siteBlockerSyncManager) {
                siteBlockerSyncManager.processQueue();
              }
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to bulk remove sites",
            });
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
            // Fallback to localStorage for non-extension environments
            return localStorage.getItem(name);
          },
          setItem: async (name, value) => {
            const anyGlobal: any = typeof window !== "undefined" ? (window as any) : {};
            if (anyGlobal?.chrome?.storage?.local) {
              await anyGlobal.chrome.storage.local.set({ [name]: value });
            } else {
              // Fallback to localStorage for non-extension environments
              localStorage.setItem(name, value);
            }
          },
          removeItem: async (name) => {
            const anyGlobal: any = typeof window !== "undefined" ? (window as any) : {};
            if (anyGlobal?.chrome?.storage?.local) {
              await anyGlobal.chrome.storage.local.remove(name);
            } else {
              // Fallback to localStorage for non-extension environments
              localStorage.removeItem(name);
            }
          },
        })),
        version: 2,
        partialize: (state) => ({ 
          sites: state.sites,
          _hasHydrated: state._hasHydrated 
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
          // Always initialize store on rehydration to load from IndexedDB
          // This ensures Chrome storage and IndexedDB stay in sync
          state?.initializeStore?.();
        },
      }
    )
  )
);

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║              Site Blocker Sync Manager Initialization                 ║
 * ╠═══════════════════════════════════════════════════════════════════════╣
 * ║  Sets up the site blocker sync manager with proper adapters and       ║
 * ║  configuration for offline-first synchronization.                     ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
function initializeSiteBlockerSync() {
  const siteBlockerAdapter = createAdapter<SiteBlocker, any>({
    entityKey: "site-blocker",
    dbTable: db.siteBlocker as any,
    api: {
      bulkSync: siteBlockerApi.bulkSync,
      fetchAll: () => siteBlockerApi.getSiteBlockers(),
    },
    store: {
      getUserId: () => useAuthStore.getState().user?.id,
      getItems: () => useSiteBlockerStore.getState().sites,
      setItems: (list) => useSiteBlockerStore.setState({ sites: list }),
    },
    normalizeFromServer: (sb: any): SiteBlocker => normalizeDates(sb),
    customTransformers: {
      toCreatePayload: (op) => {
        if (op.type !== "create") return null;
        const d = op.data || {};
        return {
          clientId: op.entityId,
          url: d.url,
          category: d.category,
          isBlocked: d.isBlocked,
          updatedAt: d.updatedAt,
        };
      },
      toUpdatePayload: (op) => {
        if (op.type !== "update") return null;
        const d = op.data || {};
        return {
          id: op.entityId,
          url: d.url,
          category: d.category,
          isBlocked: d.isBlocked,
          updatedAt: d.updatedAt,
          deletedAt: d.deletedAt,
        };
      },
    },
    options: {
      autoSync: true,
      syncInterval: 60 * 60 * 1000, // 1 hour
      enableOptimisticUpdates: true,
    },
  });

  siteBlockerSyncManager = createEntitySync(siteBlockerAdapter);
}

// Initialize on first Pro user login
useAuthStore.subscribe((state) => {
  const user = state.user;
  if (user?.isPro && !siteBlockerSyncManager) {
    initializeSiteBlockerSync();
  } else if ((!user || !user.isPro) && siteBlockerSyncManager) {
    siteBlockerSyncManager.dispose();
    siteBlockerSyncManager = null;
  }
});

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                    Handle Online Status Changes                       ║
 * ╠═══════════════════════════════════════════════════════════════════════╣
 * ║  Triggers sync queue processing when transitioning from offline       ║
 * ║  to online. Ensures no concurrent syncs are running.                  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
let isSyncingOnReconnect = false;

const handleOnlineStatusChange = (state: SyncState, prevState: SyncState) => {
  const justCameOnline = state.isOnline && !prevState.isOnline;
  const isProUser = useAuthStore.getState().user?.isPro;
  const canSync = justCameOnline && isProUser && !isSyncingOnReconnect;

  if (canSync) {
    isSyncingOnReconnect = true;
    useSiteBlockerStore
      .getState()
      .syncWithServer()
      .finally(() => {
        isSyncingOnReconnect = false;
      });
  }
};

useSyncStore.subscribe(handleOnlineStatusChange);