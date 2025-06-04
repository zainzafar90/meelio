import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { siteBlockerService, SiteBlockerDto } from "../services";
import { useAuthStore } from "./auth.store";

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

export const useSiteBlockerStore = create<SiteBlockerState>()(
  persist(
    (set, get) => ({
      blockedSites: [],
      idMap: {},
      addSite: async (url) => {
        set((state) => ({ blockedSites: Array.from(new Set([...state.blockedSites, url])) }));
        const user = useAuthStore.getState().user;
        if (user) {
          try {
            const res = await siteBlockerService.addBlockedSite(url);
            set((state) => ({ idMap: { ...state.idMap, [url]: res.id } }));
          } catch (e) {
            console.error(e);
          }
        }
      },
      removeSite: async (url, sync = true) => {
        set((state) => ({
          blockedSites: state.blockedSites.filter((s) => s !== url),
        }));
        const user = useAuthStore.getState().user;
        if (sync && user) {
          const id = get().idMap[url];
          if (id) {
            try {
              await siteBlockerService.removeBlockedSite(id);
            } catch (e) {
              console.error(e);
            }
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
        if (!user) return;
        try {
          const sites = await siteBlockerService.getBlockedSites();
          set({
            blockedSites: sites.map((s) => s.url),
            idMap: Object.fromEntries(sites.map((s) => [s.url, s.id])),
          });
        } catch (e) {
          console.error(e);
        }
      },
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "site-blocker-storage",
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
      partialize: (state) => ({ blockedSites: state.blockedSites, idMap: state.idMap }),
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
