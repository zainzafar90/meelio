/* eslint-disable no-unused-vars */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { siteBlockerApi } from "../api/site-blocker.api";
import { generateUUID } from "../utils/common.utils";

interface SiteBlockState {
  id: string;
  url: string;
  blocked: boolean;
  streak: number;
  createdAt: number;
  updatedAt?: number;
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
        
        // Check if already blocked
        const existing = Object.values(get().sites).find(
          (s) => s.url === normalizedUrl && s.blocked
        );
        if (existing) return;

        // Generate a temporary ID for optimistic update
        const tempId = `temp_${generateUUID()}`;
        const createdAt = Date.now();
        
        // Optimistically add to local state
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

        // Sync to server if Pro user
        if (user?.isPro) {
          try {
            const result = await siteBlockerApi.bulkSync({
              creates: [{ clientId: tempId, url: normalizedUrl, category, isBlocked: true }],
            });
            
            // Update local state with server ID
            if (result.created && result.created.length > 0) {
              const created = result.created[0];
              set((state) => {
                const copy = { ...state.sites };
                delete copy[tempId];
                copy[created.id] = {
                  id: created.id,
                  url: normalizedUrl,
                  blocked: created.isBlocked,
                  streak: 0,
                  createdAt,
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
          (s) => s.url === normalizedUrl && s.blocked
        );
        if (!entry) return;

        // Optimistically remove from local state
        set((state) => {
          const copy = { ...state.sites };
          delete copy[entry.id];
          return { sites: copy };
        });

        // Sync to server if Pro user
        if (user?.isPro && !entry.id.startsWith("temp_")) {
          try {
            await siteBlockerApi.bulkSync({
              deletes: [{ id: entry.id }],
            });
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
        const entry = Object.values(get().sites).find(
          (s) => s.url === normalizedUrl && s.blocked
        );
        
        if (entry) {
          await get().removeSite(url);
        } else {
          await get().addSite(url);
        }
      },

      bulkAddSites: async (urls, category) => {
        const user = useAuthStore.getState().user;
        const normalizedUrls = urls.map(normalizeUrl);
        const currentSites = get().sites;
        
        // Filter out already blocked sites
        const toAdd = normalizedUrls.filter(url => 
          !Object.values(currentSites).some(s => s.url === url && s.blocked)
        );
        
        if (toAdd.length === 0) return;
        
        // Generate temp IDs and optimistically update
        const creates: Array<{ clientId: string; url: string; category?: string; isBlocked?: boolean }> = [];
        const newSites: Record<string, SiteBlockState> = {};
        
        for (const url of toAdd) {
          const tempId = `temp_${generateUUID()}`;
          creates.push({ clientId: tempId, url, category, isBlocked: true });
          newSites[tempId] = {
            id: tempId,
            url,
            blocked: true,
            streak: 0,
            createdAt: Date.now(),
          };
        }
        
        // Optimistically update local state
        set((state) => ({
          sites: { ...state.sites, ...newSites }
        }));
        
        // Sync to server if Pro user
        if (user?.isPro) {
          try {
            const result = await siteBlockerApi.bulkSync({ creates });
            
            // Update local state with server IDs
            if (result.created && result.created.length > 0) {
              set((state) => {
                const copy = { ...state.sites };
                for (const created of result.created) {
                  if (created.clientId) {
                    delete copy[created.clientId];
                    copy[created.id] = {
                      id: created.id,
                      url: normalizeUrl(created.url),
                      blocked: created.isBlocked,
                      streak: 0,
                      createdAt: newSites[created.clientId]?.createdAt || Date.now(),
                    };
                  }
                }
                return { sites: copy };
              });
            }
          } catch (error) {
            console.error("Failed to bulk sync site blocks:", error);
            // Remove optimistic updates on failure
            set((state) => {
              const copy = { ...state.sites };
              for (const { clientId } of creates) {
                delete copy[clientId];
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
        
        // Find sites to remove
        const toRemove = Object.values(currentSites).filter(site => 
          normalizedUrls.includes(site.url) && site.blocked
        );
        
        if (toRemove.length === 0) return;
        
        // Optimistically remove from local state
        set((state) => {
          const copy = { ...state.sites };
          for (const site of toRemove) {
            delete copy[site.id];
          }
          return { sites: copy };
        });
        
        // Sync to server if Pro user
        if (user?.isPro) {
          const deletes = toRemove
            .filter(site => !site.id.startsWith("temp_"))
            .map(site => ({ id: site.id }));
            
          if (deletes.length > 0) {
            try {
              await siteBlockerApi.bulkSync({ deletes });
            } catch (error) {
              console.error("Failed to bulk unblock sites:", error);
              // Restore on failure
              set((state) => {
                const copy = { ...state.sites };
                for (const site of toRemove) {
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
          const server = await siteBlockerApi.getBlockedSites();
          
          // Convert server data to local format
          const serverSites: SiteBlockState[] = server
            .map(site => ({
              id: site.id,
              url: normalizeUrl(site.url),
              blocked: site.isBlocked,
              streak: 0,
              createdAt: new Date(site.createdAt).getTime(),
              updatedAt: new Date(site.updatedAt).getTime(),
            }));
          
          // Get current local state
          const localSites = Object.values(get().sites);
          
          // Merge using LWW - server wins on conflicts
          const mergedMap: Record<string, SiteBlockState> = {};
          
          // Add all local sites first
          for (const site of localSites) {
            mergedMap[site.id] = site;
          }
          
          // Merge server sites (server wins on conflict)
          for (const site of serverSites) {
            mergedMap[site.id] = site;
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