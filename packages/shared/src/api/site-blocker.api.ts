import { axios } from "../api/axios";
import { useAuthStore } from "../stores/auth.store";

export interface SiteBlocker {
  id: string;
  url: string;
  category?: string;
}

function checkPro() {
  const isPro = useAuthStore.getState().user?.isPro;
  if (!isPro) {
    throw new Error("Pro subscription required");
  }
}

export const siteBlockerApi = {
  async getBlockedSites(): Promise<SiteBlocker[]> {
    checkPro();
    const res = await axios.get("/v1/site-blockers");
    return res.data;
  },

  async addBlockedSite(url: string, category?: string): Promise<SiteBlocker> {
    checkPro();
    const res = await axios.post("/v1/site-blockers", { url, category });
    return res.data;
  },

  async removeBlockedSite(id: string): Promise<void> {
    checkPro();
    await axios.delete(`/v1/site-blockers/${id}`);
  },
};
