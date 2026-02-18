import {
  createSiteBlockerStore,
  db,
  generateUUID,
  type SiteBlocker,
  type SiteBlockerGateway,
  useAuthStore,
} from "@repo/shared";
import type { StateStorage } from "zustand/middleware";

const extensionStorage: StateStorage = {
  getItem: async (name) => {
    if (chrome?.storage?.local) {
      const result = await chrome.storage.local.get(name);
      return result[name] ?? null;
    }
    return localStorage.getItem(name);
  },
  setItem: async (name, value) => {
    if (chrome?.storage?.local) {
      await chrome.storage.local.set({ [name]: value });
      return;
    }
    localStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    if (chrome?.storage?.local) {
      await chrome.storage.local.remove(name);
      return;
    }
    localStorage.removeItem(name);
  },
};

const extensionSiteBlockerGateway: SiteBlockerGateway = {
  getCurrentUserId: () => useAuthStore.getState().user?.id,
  getSitesByUser: async (userId: string) =>
    db.siteBlocker.where("userId").equals(userId).toArray(),
  addSite: async (site: SiteBlocker) => {
    await db.siteBlocker.add(site);
  },
  updateSite: async (id: string, updates: Partial<SiteBlocker>) => {
    await db.siteBlocker.update(id, updates);
  },
  generateId: () => generateUUID(),
  getStorage: () => extensionStorage,
};

export const useExtensionSiteBlockerStore = createSiteBlockerStore(
  extensionSiteBlockerGateway
);
