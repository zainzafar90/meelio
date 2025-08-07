import { db } from "@/db";
import { TabStash, TabStashInsert, tabStashes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface CreateTabStashData {
  windowId: string;
  urls: string[];
}

type UpdateTabStashData = Partial<CreateTabStashData>;

export const tabStashService = {
  /**
   * Get tab stashes for a user
   */
  getTabStashes: async (userId: string): Promise<TabStash[]> => {
    return await db
      .select()
      .from(tabStashes)
      .where(and(eq(tabStashes.userId, userId), eq(tabStashes.deletedAt, null)));
  },

  /**
   * Get a tab stash by ID
   */
  getTabStashById: async (id: string, userId: string): Promise<TabStash> => {
    const result = await db
      .select()
      .from(tabStashes)
      .where(and(eq(tabStashes.id, id), eq(tabStashes.userId, userId)));

    if (result.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Tab stash not found");
    }

    return result[0];
  },

  /**
   * Create a tab stash
   */
  createTabStash: async (
    userId: string,
    data: CreateTabStashData
  ): Promise<TabStash> => {
    const tabStashData: TabStashInsert = {
      userId,
      windowId: data.windowId,
      urls: data.urls,
    };

    const result = await db.insert(tabStashes).values(tabStashData).returning();

    return result[0];
  },

  /**
   * Update a tab stash
   */
  updateTabStash: async (
    id: string,
    userId: string,
    data: UpdateTabStashData
  ): Promise<TabStash> => {
    // Check if tab stash exists
    await tabStashService.getTabStashById(id, userId);

    const updateData: Partial<TabStashInsert> = {};

    if (data.windowId) {
      updateData.windowId = data.windowId;
    }

    if (data.urls) {
      updateData.urls = data.urls;
    }

    const result = await db
      .update(tabStashes)
      .set(updateData)
      .where(and(eq(tabStashes.id, id), eq(tabStashes.userId, userId)))
      .returning();

    return result[0];
  },

  /**
   * Delete a tab stash
   */
  deleteTabStash: async (id: string, userId: string): Promise<void> => {
    // Check if tab stash exists
    await tabStashService.getTabStashById(id, userId);

    await db
      .update(tabStashes)
      .set({ deletedAt: new Date() } as TabStash)
      .where(and(eq(tabStashes.id, id), eq(tabStashes.userId, userId)));
  },
  bulkSync: async (
    userId: string,
    payload: {
      creates: Array<{ windowId: string; urls: string[] }>;
      updates: Array<{ id: string; windowId?: string; urls?: string[] }>;
      deletes: Array<{ id: string }>;
    }
  ): Promise<{ created: TabStash[]; updated: TabStash[]; deleted: string[] }> => {
    const created: TabStash[] = [];
    const updated: TabStash[] = [];
    const deleted: string[] = [];

    for (const c of payload.creates || []) {
      const ts = await tabStashService.createTabStash(userId, c);
      created.push(ts);
    }

    for (const u of payload.updates || []) {
      const ts = await tabStashService.updateTabStash(u.id, userId, u);
      updated.push(ts);
    }

    for (const d of payload.deletes || []) {
      await db
        .update(tabStashes)
        .set({ deletedAt: new Date() } as any)
        .where(and(eq(tabStashes.id, d.id), eq(tabStashes.userId, userId)));
      deleted.push(d.id);
    }

    return { created, updated, deleted };
  },
};
