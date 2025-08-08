import { axios } from "../api/axios";
import { useAuthStore } from "../stores/auth.store";

export interface SiteBlockerDto {
  id: string;
  url: string;
  category?: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function checkPro() {
  const isPro = useAuthStore.getState().user?.isPro;
  if (!isPro) {
    throw new Error("Pro subscription required");
  }
}

export const siteBlockerApi = {
  async getBlockedSites(): Promise<SiteBlockerDto[]> {
    checkPro();
    const res = await axios.get("/v1/site-blockers");
    return res.data;
  },

  async addBlockedSite(url: string, category?: string): Promise<SiteBlockerDto> {
    checkPro();
    const res = await axios.post("/v1/site-blockers", { url, category });
    return res.data;
  },

  async removeBlockedSite(id: string): Promise<void> {
    checkPro();
    await axios.delete(`/v1/site-blockers/${id}`);
  },

  async bulkSync(payload: {
    creates?: Array<{ clientId?: string; url: string; category?: string; isBlocked?: boolean }>;
    deletes?: Array<{ id?: string; clientId?: string }>;
  }): Promise<{ created: Array<SiteBlockerDto & { clientId?: string }>; deleted: string[] }> {
    checkPro();
    const res = await axios.post(`/v1/site-blockers/bulk`, payload);
    return res.data;
  },
};
