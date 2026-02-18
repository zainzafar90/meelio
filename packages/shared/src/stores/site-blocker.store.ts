import { create } from "zustand";
import {
  subscribeWithSelector,
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";

import { db } from "../lib/db/meelio.dexie";
import type { SiteBlocker } from "../lib/db/models.dexie";
import { generateUUID } from "../utils/common.utils";
import { normalizeSiteHost } from "../utils/site-blocker.utils";
import { useAuthStore } from "./auth.store";

export interface SiteBlockerState {
  sites: SiteBlocker[];
  isLoading: boolean;
  error: string | null;

  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;

  addSite: (url: string, category?: string) => Promise<SiteBlocker | undefined>;
  toggleSite: (url: string) => Promise<void>;
  removeSite: (url: string) => Promise<void>;
  bulkAddSites: (urls: string[], category?: string) => Promise<void>;
  bulkRemoveSites: (urls: string[]) => Promise<void>;
}

export interface SiteBlockerGateway {
  getCurrentUserId(): string | undefined;
  getSitesByUser(userId: string): Promise<SiteBlocker[]>;
  addSite(site: SiteBlocker): Promise<void>;
  updateSite(id: string, updates: Partial<SiteBlocker>): Promise<void>;
  generateId(): string;
  getStorage(): StateStorage;
}

const localStorageAdapter: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

export const createDefaultSiteBlockerGateway = (): SiteBlockerGateway => ({
  getCurrentUserId: () => useAuthStore.getState().user?.id,
  getSitesByUser: (userId) =>
    db.siteBlocker.where("userId").equals(userId).toArray(),
  addSite: async (site) => {
    await db.siteBlocker.add(site);
  },
  updateSite: async (id, updates) => {
    await db.siteBlocker.update(id, updates);
  },
  generateId: () => generateUUID(),
  getStorage: () => localStorageAdapter,
});

export const createSiteBlockerStore = (gateway: SiteBlockerGateway) => {
  let isInitializing = false;
  return create<SiteBlockerState>()(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          sites: [],
          isLoading: false,
          error: null,

          initializeStore: async () => {
            const userId = gateway.getCurrentUserId();
            if (!userId || isInitializing) {
              return;
            }

            isInitializing = true;
            try {
              set({ isLoading: true, error: null });
              await get().loadFromLocal();
            } catch (error: any) {
              console.error("Failed to initialize site blocker store:", error);
              set({ error: error?.message || "Failed to initialize store" });
            } finally {
              set({ isLoading: false });
              isInitializing = false;
            }
          },

          loadFromLocal: async () => {
            const userId = gateway.getCurrentUserId();
            if (!userId) return;

            const localSiteBlockers = await gateway.getSitesByUser(userId);
            const currentState = get();

            if (currentState.sites.length > 0 && localSiteBlockers.length === 0) {
              for (const site of currentState.sites) {
                try {
                  await gateway.addSite({ ...site, userId });
                } catch (error) {
                  console.warn("Failed to migrate site blocker:", site.url, error);
                }
              }
              const migratedSites = await gateway.getSitesByUser(userId);
              set({ sites: migratedSites.filter((site) => !site.deletedAt) });
              return;
            }

            set({ sites: localSiteBlockers.filter((site) => !site.deletedAt) });
          },

          addSite: async (url, category) => {
            const MAX_SITE_BLOCKERS = 500;
            const normalizedUrl = normalizeSiteHost(url);
            const now = Date.now();

            const existing = get().sites.find((site) => site.url === normalizedUrl);
            if (existing && existing.isBlocked) {
              return existing;
            }

            if (get().sites.filter((site) => site.isBlocked).length >= MAX_SITE_BLOCKERS) {
              return undefined;
            }

            const userId = gateway.getCurrentUserId();
            if (!userId) return;

            try {
              if (existing) {
                await gateway.updateSite(existing.id, {
                  isBlocked: true,
                  updatedAt: now,
                  deletedAt: null,
                });

                set((state) => ({
                  sites: state.sites.map((site) =>
                    site.id === existing.id
                      ? { ...site, isBlocked: true, updatedAt: now, deletedAt: null }
                      : site
                  ),
                }));

                return { ...existing, isBlocked: true, updatedAt: now, deletedAt: null };
              }

              const siteBlocker: SiteBlocker = {
                id: gateway.generateId(),
                userId,
                url: normalizedUrl,
                category: category || undefined,
                isBlocked: true,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
              };

              await gateway.addSite(siteBlocker);
              set((state) => ({ sites: [...state.sites, siteBlocker] }));
              return siteBlocker;
            } catch (error) {
              set({
                error: error instanceof Error ? error.message : "Failed to add site",
              });
              return undefined;
            }
          },

          toggleSite: async (url) => {
            const normalizedUrl = normalizeSiteHost(url);
            const site = get().sites.find((entry) => entry.url === normalizedUrl);

            if (!site) {
              await get().addSite(url);
              return;
            }

            const updates = { isBlocked: !site.isBlocked, updatedAt: Date.now() };
            try {
              await gateway.updateSite(site.id, updates);
              set((state) => ({
                sites: state.sites.map((entry) =>
                  entry.id === site.id ? { ...entry, ...updates } : entry
                ),
              }));
            } catch (error) {
              set({
                error: error instanceof Error ? error.message : "Failed to toggle site",
              });
            }
          },

          removeSite: async (url) => {
            const normalizedUrl = normalizeSiteHost(url);
            const site = get().sites.find(
              (entry) => entry.url === normalizedUrl && entry.isBlocked
            );
            if (!site) return;

            try {
              const deletedAt = Date.now();
              await gateway.updateSite(site.id, { deletedAt, updatedAt: deletedAt });
              set((state) => ({
                sites: state.sites.filter((entry) => entry.id !== site.id),
              }));
            } catch (error) {
              set({
                error: error instanceof Error ? error.message : "Failed to remove site",
              });
            }
          },

          bulkAddSites: async (urls, category) => {
            const userId = gateway.getCurrentUserId();
            if (!userId) return;

            const normalizedUrls = urls.map(normalizeSiteHost);
            const currentSites = get().sites;
            const now = Date.now();

            const toUpdate: SiteBlocker[] = [];
            const toCreate: SiteBlocker[] = [];

            for (const url of normalizedUrls) {
              const existing = currentSites.find((site) => site.url === url);
              if (existing) {
                if (!existing.isBlocked) {
                  toUpdate.push({ ...existing, isBlocked: true, updatedAt: now, deletedAt: null });
                }
              } else {
                toCreate.push({
                  id: gateway.generateId(),
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
              for (const site of toUpdate) {
                await gateway.updateSite(site.id, {
                  isBlocked: true,
                  updatedAt: now,
                  deletedAt: null,
                });
              }

              for (const site of toCreate) {
                await gateway.addSite(site);
              }

              set((state) => ({
                sites: [
                  ...state.sites.map((site) => {
                    const updated = toUpdate.find((entry) => entry.id === site.id);
                    return updated || site;
                  }),
                  ...toCreate,
                ],
              }));
            } catch (error) {
              set({
                error:
                  error instanceof Error ? error.message : "Failed to bulk add sites",
              });
            }
          },

          bulkRemoveSites: async (urls) => {
            const normalizedUrls = urls.map(normalizeSiteHost);
            const toRemove = get().sites.filter(
              (site) => normalizedUrls.includes(site.url) && site.isBlocked
            );

            if (toRemove.length === 0) return;

            try {
              const deletedAt = Date.now();
              for (const site of toRemove) {
                await gateway.updateSite(site.id, { deletedAt, updatedAt: deletedAt });
              }

              set((state) => ({
                sites: state.sites.filter(
                  (site) => !toRemove.some((removed) => removed.id === site.id)
                ),
              }));
            } catch (error) {
              set({
                error:
                  error instanceof Error ? error.message : "Failed to bulk remove sites",
              });
            }
          },
        }),
        {
          name: "meelio:local:site-blocker",
          storage: createJSONStorage(() => gateway.getStorage()),
          version: 2,
          partialize: (state) => ({
            sites: state.sites,
          }),
          onRehydrateStorage: () => (state) => {
            state?.initializeStore?.();
          },
        }
      )
    )
  );
};

export const useSiteBlockerStore = createSiteBlockerStore(
  createDefaultSiteBlockerGateway()
);
