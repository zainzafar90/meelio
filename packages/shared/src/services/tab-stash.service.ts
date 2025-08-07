import { axios } from "../api/axios";

export interface TabStash {
  id: string;
  userId: string;
  windowId: string;
  urls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTabStashDto {
  windowId: string;
  urls: string[];
}

export interface UpdateTabStashDto {
  windowId?: string;
  urls?: string[];
}

export const tabStashService = {
  async getTabStashes(): Promise<TabStash[]> {
    const res = await axios.get("/v1/tab-stashes");
    return res.data;
  },

  async getTabStash(id: string): Promise<TabStash> {
    const res = await axios.get(`/v1/tab-stashes/${id}`);
    return res.data;
  },

  async createTabStash(data: CreateTabStashDto): Promise<TabStash> {
    const res = await axios.post("/v1/tab-stashes", data);
    return res.data;
  },

  async updateTabStash(
    id: string,
    data: UpdateTabStashDto
  ): Promise<TabStash> {
    const res = await axios.patch(`/v1/tab-stashes/${id}`, data);
    return res.data;
  },

  async deleteTabStash(id: string): Promise<void> {
    await axios.delete(`/v1/tab-stashes/${id}`);
  },
  async bulkSync(payload: {
    creates?: Array<{ clientId?: string; windowId: string; urls: string[] }>;
    updates?: Array<{ id?: string; clientId?: string; windowId?: string; urls?: string[] }>;
    deletes?: Array<{ id?: string; clientId?: string }>;
  }): Promise<{ created: Array<TabStash & { clientId?: string }>; updated: TabStash[]; deleted: string[] }> {
    const res = await axios.post(`/v1/tab-stashes/bulk`, payload);
    return res.data;
  },
};
