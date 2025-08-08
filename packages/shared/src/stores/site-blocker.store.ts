/* eslint-disable no-unused-vars */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { siteBlockerApi } from "../api/site-blocker.api";
import { generateUUID } from "../utils/common.utils";
import { lwwMergeById } from "../utils/sync.utils";
import { withRetry } from "../utils/retry.utils";

interface SiteBlockState {
  id: string;
  url: string;
  isBlocked: boolean;
  streak: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

interface SiteBlockerState {
  sites: Record<string, SiteBlockState>;
  addSite: (url: string, category?: string) => Promise<void>;
  removeSite: (url: string) => Promise<void>;
  toggleSite: (url: string) => Promise<void>;
  bulkAddSites: (urls: string[], category?: string) => Promise<void>;
  bulkRemoveSites: (urls: string[]) => Promise<void>;
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

export const useSiteBlockerStore = create<SiteBlockerState>()(
  persist(
    (set, get) => ({
      sites: {},
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addSite: async (url, category) => {
        const normalizedUrl = normalizeUrl(url);
        const user = useAuthStore.getState().user;
        
        // Check if site already exists
        const existing = Object.values(get().sites).find(
          (s) => s.url === normalizedUrl
        );
        
        if (existing) {
          // If already blocked, nothing to do
          if (existing.isBlocked) return;
          
          // Site exists but not blocked, update it to blocked
          set((state) => ({
            sites: {
              ...state.sites,
              [existing.id]: {
                ...existing,
                isBlocked: true,
                updatedAt: Date.now(),
              },
            },
          }));
          
          // Sync to server if Pro user
          if (user?.isPro && !existing.id.startsWith("temp_")) {
            try {
              const result = await siteBlockerApi.bulkSync({
                creates: [{
                  url: normalizedUrl,
                  category,
                  isBlocked: true,
                }],
              });
              
              if (result.created && result.created.length > 0) {
                const updated = result.created[0];
                set((state) => ({
                  sites: {
                    ...state.sites,
                    [updated.id]: {
                      id: updated.id,
                      url: normalizedUrl,
                      isBlocked: updated.isBlocked,
                      streak: existing.streak,
                      createdAt: existing.createdAt,
                      updatedAt: Date.now(),
                    },
                  },
                }));
              }
            } catch (error) {
              console.error("Failed to sync site block:", error);
              // Revert on failure
              set((state) => ({
                sites: {
                  ...state.sites,
                  [existing.id]: existing,
                },
              }));
            }
          }
          return;
        }

        // Site doesn't exist, create new one
        const tempId = `temp_${generateUUID()}`;
        const createdAt = Date.now();
        
        // Optimistically add to local state
        set((state) => ({
          sites: {
            ...state.sites,
            [tempId]: {
              id: tempId,
              url: normalizedUrl,
              isBlocked: true,
              streak: 0,
              createdAt,
              updatedAt: createdAt,
            },
          },
        }));

        // Sync to server if Pro user
        if (user?.isPro) {
          try {
            const result = await withRetry(() => 
              siteBlockerApi.bulkSync({
                creates: [{ clientId: tempId, url: normalizedUrl, category, isBlocked: true }],
              })
            );
            
            // Update local state with server ID
            if (result.created && result.created.length > 0) {
              const created = result.created[0];
              set((state) => {
                const copy = { ...state.sites };
                delete copy[tempId];
                copy[created.id] = {
                  id: created.id,
                  url: normalizedUrl,
                  isBlocked: created.isBlocked,
                  streak: 0,
                  createdAt,
                  updatedAt: new Date(created.updatedAt).getTime(),
                  deletedAt: created.deletedAt ? new Date(created.deletedAt).getTime() : null,
                };
                return { sites: copy };
              });
            }
          } catch (error) {
            console.error("Failed to sync site block:", error);
            // Remove optimistic update on failure
            set((state) => {
              const copy = { ...state.sites };
              delete copy[tempId];
              return { sites: copy };
            });
          }
        }
      },

      removeSite: async (url) => {
        const normalizedUrl = normalizeUrl(url);
        const user = useAuthStore.getState().user;
        
        const entry = Object.values(get().sites).find(
          (s) => s.url === normalizedUrl && s.isBlocked
        );
        if (!entry) return;

        // Optimistically update to isBlocked: false
        set((state) => ({
          sites: {
            ...state.sites,
            [entry.id]: {
              ...entry,
              isBlocked: false,
              updatedAt: Date.now(),
            },
          },
        }));

        // Sync to server if Pro user
        if (user?.isPro && !entry.id.startsWith("temp_")) {
          try {
            // Using creates will update if exists due to backend logic
            const result = await siteBlockerApi.bulkSync({
              creates: [{
                url: normalizedUrl,
                isBlocked: false,
              }],
            });
            
            // Update with server response if site was updated
            if (result.created && result.created.length > 0) {
              const updated = result.created[0];
              set((state) => ({
                sites: {
                  ...state.sites,
                  [updated.id]: {
                    id: updated.id,
                    url: normalizedUrl,
                    isBlocked: updated.isBlocked,
                    streak: entry.streak,
                    createdAt: entry.createdAt,
                    updatedAt: Date.now(),
                  },
                },
              }));
            }
          } catch (error) {
            console.error("Failed to sync site unblock:", error);
            // Restore on failure
            set((state) => ({
              sites: {
                ...state.sites,
                [entry.id]: entry,
              },
            }));
          }
        }
      },

      toggleSite: async (url) => {
        const normalizedUrl = normalizeUrl(url);
        const user = useAuthStore.getState().user;
        
        // Find existing entry regardless of blocked status
        const entry = Object.values(get().sites).find(
          (s) => s.url === normalizedUrl
        );
        
        if (entry) {
          // Toggle the blocked status
          const newBlockedStatus = !entry.isBlocked;
          const updatedAt = Date.now();
          
          // Optimistically update local state
          set((state) => ({
            sites: {
              ...state.sites,
              [entry.id]: {
                ...entry,
                isBlocked: newBlockedStatus,
                updatedAt,
              },
            },
          }));
          
          // Sync to server if Pro user
          if (user?.isPro && !entry.id.startsWith("temp_")) {
            try {
              // Use updates for existing entries with retry
              const result = await withRetry(() => 
                siteBlockerApi.bulkSync({
                  updates: [{
                    id: entry.id,
                    isBlocked: newBlockedStatus,
                  }],
                })
              );
              
              // Update with server response if site was updated
              if (result.updated && result.updated.length > 0) {
                const updated = result.updated[0];
                set((state) => ({
                  sites: {
                    ...state.sites,
                    [updated.id]: {
                      id: updated.id,
                      url: updated.url || normalizedUrl,
                      isBlocked: updated.isBlocked,
                      streak: entry.streak,
                      createdAt: entry.createdAt,
                      updatedAt: new Date(updated.updatedAt).getTime(),
                      deletedAt: updated.deletedAt ? new Date(updated.deletedAt).getTime() : null,
                    },
                  },
                }));
              }
            } catch (error) {
              console.error("Failed to toggle site block:", error);
              // Revert on failure
              set((state) => ({
                sites: {
                  ...state.sites,
                  [entry.id]: entry,
                },
              }));
            }
          }
        } else {
          // Site doesn't exist, add it as blocked
          await get().addSite(url);
        }
      },

      bulkAddSites: async (urls, category) => {
        const user = useAuthStore.getState().user;
        const normalizedUrls = urls.map(normalizeUrl);
        const currentSites = get().sites;
        
        // Separate existing unblocked sites from new sites
        const existingUnblocked: SiteBlockState[] = [];
        const newUrls: string[] = [];
        
        for (const url of normalizedUrls) {
          const existing = Object.values(currentSites).find(s => s.url === url);
          if (existing) {
            if (!existing.isBlocked) {
              existingUnblocked.push(existing);
            }
            // Skip if already blocked
          } else {
            newUrls.push(url);
          }
        }
        
        if (existingUnblocked.length === 0 && newUrls.length === 0) {
          return;
        }
        
        // Update existing unblocked sites to blocked
        if (existingUnblocked.length > 0) {
          set((state) => {
            const copy = { ...state.sites };
            for (const site of existingUnblocked) {
              copy[site.id] = {
                ...site,
                isBlocked: true,
                updatedAt: Date.now(),
              };
            }
            return { sites: copy };
          });
        }
        
        // Generate temp IDs and optimistically update for new sites
        const creates: Array<{ clientId?: string; url: string; category?: string; isBlocked?: boolean }> = [];
        const updates: Array<{ id?: string; clientId?: string; url?: string; category?: string; isBlocked?: boolean }> = [];
        const newSites: Record<string, SiteBlockState> = {};
        
        // Add existing unblocked sites to updates (not creates)
        for (const site of existingUnblocked) {
          if (!site.id.startsWith("temp_")) {
            updates.push({ id: site.id, category, isBlocked: true });
          }
        }
        
        // Add new sites to creates
        for (const url of newUrls) {
          const tempId = `temp_${generateUUID()}`;
          creates.push({ clientId: tempId, url, category, isBlocked: true });
          newSites[tempId] = {
            id: tempId,
            url,
            isBlocked: true,
            streak: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        }
        
        // Optimistically update local state with new sites
        if (Object.keys(newSites).length > 0) {
          set((state) => ({
            sites: { ...state.sites, ...newSites }
          }));
        }
        
        // For non-pro users, just update local state
        if (!user?.isPro) {
          return;
        }
        
        // Sync to server if Pro user
        if (creates.length > 0 || updates.length > 0) {
          try {
            const result = await withRetry(() => 
              siteBlockerApi.bulkSync({ creates, updates })
            );
            
            // Update local state with server responses
            set((state) => {
              const copy = { ...state.sites };
              
              // Handle created items
              if (result.created && result.created.length > 0) {
                for (const created of result.created) {
                  // Remove temp entry if it exists
                  if (created.clientId && newSites[created.clientId]) {
                    delete copy[created.clientId];
                  }
                  
                  // Add or update the site with server data
                  // This handles both new sites and sites that existed on server but not locally
                  const siteData = {
                    id: created.id,
                    url: normalizeUrl(created.url),
                    isBlocked: created.isBlocked,
                    streak: copy[created.id]?.streak || 0,
                    createdAt: (created.clientId && newSites[created.clientId]?.createdAt) || 
                              copy[created.id]?.createdAt || 
                              new Date(created.createdAt).getTime(),
                    updatedAt: new Date(created.updatedAt).getTime(),
                    deletedAt: created.deletedAt ? new Date(created.deletedAt).getTime() : null,
                  };
                  
                  copy[created.id] = siteData;
                }
              }
              
              // Handle updated items
              if (result.updated && result.updated.length > 0) {
                for (const updated of result.updated) {
                  copy[updated.id] = {
                    ...copy[updated.id],
                    isBlocked: updated.isBlocked,
                    updatedAt: new Date(updated.updatedAt).getTime(),
                    deletedAt: updated.deletedAt ? new Date(updated.deletedAt).getTime() : null,
                  };
                }
              }
              
              return { sites: copy };
            });
            
            // If we created new sites, do a full sync to ensure we have all data
            // This handles the case where sites already existed on server
            if (result.created && result.created.length > 0) {
              setTimeout(() => get().syncWithServer(), 500);
            }
          } catch (error) {
            console.error("Failed to bulk sync site blocks:", error);
            // Remove optimistic updates on failure
            set((state) => {
              const copy = { ...state.sites };
              for (const { clientId } of creates) {
                if (clientId) {
                  delete copy[clientId];
                }
              }
              return { sites: copy };
            });
          }
        }
      },

      bulkRemoveSites: async (urls) => {
        const user = useAuthStore.getState().user;
        const normalizedUrls = urls.map(normalizeUrl);
        const currentSites = get().sites;
        
        // Find sites to update to isBlocked: false
        const toUpdate = Object.values(currentSites).filter(site => 
          normalizedUrls.includes(site.url) && site.isBlocked
        );
        
        if (toUpdate.length === 0) return;
        
        // Optimistically update to isBlocked: false
        set((state) => {
          const copy = { ...state.sites };
          for (const site of toUpdate) {
            copy[site.id] = {
              ...site,
              isBlocked: false,
              updatedAt: Date.now(),
            };
          }
          return { sites: copy };
        });
        
        // Sync to server if Pro user
        if (user?.isPro) {
          const updates = toUpdate
            .filter(site => !site.id.startsWith("temp_"))
            .map(site => ({ id: site.id, isBlocked: false }));
            
          if (updates.length > 0) {
            try {
              // Use updates for existing sites
              const result = await withRetry(() => 
                siteBlockerApi.bulkSync({ updates })
              );
              
              // Update with server response
              if (result.updated && result.updated.length > 0) {
                set((state) => {
                  const copy = { ...state.sites };
                  for (const updated of result.updated) {
                    // Update the site with server response
                    copy[updated.id] = {
                      ...copy[updated.id],
                      id: updated.id,
                      url: normalizeUrl(updated.url),
                      isBlocked: updated.isBlocked,
                      updatedAt: new Date(updated.updatedAt).getTime(),
                      deletedAt: updated.deletedAt ? new Date(updated.deletedAt).getTime() : null,
                    };
                  }
                  return { sites: copy };
                });
              }
            } catch (error) {
              console.error("Failed to bulk unblock sites:", error);
              // Restore on failure
              set((state) => {
                const copy = { ...state.sites };
                for (const site of toUpdate) {
                  copy[site.id] = site;
                }
                return { sites: copy };
              });
            }
          }
        }
      },

      initializeStore: async () => {
        const user = useAuthStore.getState().user;
        if (!user?.isPro) return;
        await get().syncWithServer();
      },

      syncWithServer: async () => {
        const user = useAuthStore.getState().user;
        if (!user?.isPro) return;
        
        try {
          const server = await withRetry(() => siteBlockerApi.getBlockedSites());
          
          // Convert server data to local format with proper timestamps
          const serverSites: SiteBlockState[] = server
            .map(site => ({
              id: site.id,
              url: normalizeUrl(site.url),
              isBlocked: site.isBlocked,
              streak: 0,
              createdAt: new Date(site.createdAt).getTime(),
              updatedAt: new Date(site.updatedAt).getTime(),
              deletedAt: site.deletedAt ? new Date(site.deletedAt).getTime() : null,
            }));
          
          // Get current local state
          const localSites = Object.values(get().sites);
          
          // Use proper LWW merge with timestamp comparison
          const merged = lwwMergeById(localSites, serverSites, "b"); // Prefer server on ties
          
          // Convert array back to map
          const mergedMap: Record<string, SiteBlockState> = {};
          for (const site of merged) {
            // Only include non-deleted sites
            if (!site.deletedAt) {
              mergedMap[site.id] = site;
            }
          }
          
          // Update state with merged data
          set({ sites: mergedMap });
        } catch (error) {
          console.error("Failed to sync with server:", error);
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