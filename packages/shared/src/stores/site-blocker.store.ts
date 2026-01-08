import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import { db } from "../lib/db/meelio.dexie";
import type { SiteBlocker } from "../lib/db/models.dexie";
import { useAuthStore } from "./auth.store";
import { generateUUID } from "../utils/common.utils";

interface SiteBlockerState {
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

          const localSiteBlockers = await db.siteBlocker
            .where("userId")
            .equals(userId)
            .toArray();

          const currentState = get();
          if (currentState.sites.length > 0 && localSiteBlockers.length === 0) {
            console.log("Migrating site blockers from Chrome storage to IndexedDB");
            for (const site of currentState.sites) {
              try {
                const siteWithUser = { ...site, userId };
                await db.siteBlocker.add(siteWithUser);
              } catch (err) {
                console.warn("Failed to migrate site:", site.url, err);
              }
            }
            const migratedSites = await db.siteBlocker
              .where("userId")
              .equals(userId)
              .toArray();
            set({
              sites: migratedSites.filter(s => !s.deletedAt),
            });
          } else {
            set({
              sites: localSiteBlockers.filter(s => !s.deletedAt),
            });
          }
        },

        addSite: async (url, category) => {
          const MAX_SITE_BLOCKERS = 500;
          const normalizedUrl = normalizeUrl(url);

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

              return { ...existing, isBlocked: true, updatedAt: now };
            }

            await db.siteBlocker.add(siteBlocker);
            set(s => ({ sites: [...s.sites, siteBlocker] }));

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
            await get().addSite(url);
            return;
          }

          const updatedData = { isBlocked: !site.isBlocked, updatedAt: Date.now() };

          try {
            await db.siteBlocker.update(site.id, updatedData);

            set(state => ({
              sites: state.sites.map(s =>
                s.id === site.id ? { ...s, ...updatedData } : s
              ),
            }));
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

          try {
            const deletedAt = Date.now();
            await db.siteBlocker.update(site.id, { deletedAt, updatedAt: deletedAt });
            set(s => ({ sites: s.sites.filter(sb => sb.id !== site.id) }));
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

          const normalizedUrls = urls.map(normalizeUrl);
          const currentSites = get().sites;
          const now = Date.now();

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
            for (const site of toUpdate) {
              await db.siteBlocker.update(site.id, {
                isBlocked: true,
                updatedAt: now,
                deletedAt: null,
              });
            }

            for (const site of toCreate) {
              await db.siteBlocker.add(site);
            }

            set(state => ({
              sites: [
                ...state.sites.map(s => {
                  const updated = toUpdate.find(u => u.id === s.id);
                  return updated || s;
                }),
                ...toCreate,
              ],
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to bulk add sites",
            });
          }
        },

        bulkRemoveSites: async (urls) => {
          const normalizedUrls = urls.map(normalizeUrl);
          const toRemove = get().sites.filter(s => normalizedUrls.includes(s.url) && s.isBlocked);

          if (toRemove.length === 0) return;

          try {
            const deletedAt = Date.now();

            for (const site of toRemove) {
              await db.siteBlocker.update(site.id, { deletedAt, updatedAt: deletedAt });
            }

            set(state => ({
              sites: state.sites.filter(s => !toRemove.some(r => r.id === s.id)),
            }));
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
            return localStorage.getItem(name);
          },
          setItem: async (name, value) => {
            const anyGlobal: any = typeof window !== "undefined" ? (window as any) : {};
            if (anyGlobal?.chrome?.storage?.local) {
              await anyGlobal.chrome.storage.local.set({ [name]: value });
            } else {
              localStorage.setItem(name, value);
            }
          },
          removeItem: async (name) => {
            const anyGlobal: any = typeof window !== "undefined" ? (window as any) : {};
            if (anyGlobal?.chrome?.storage?.local) {
              await anyGlobal.chrome.storage.local.remove(name);
            } else {
              localStorage.removeItem(name);
            }
          },
        })),
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
