import { db } from "@/db";
import { TabStash, TabStashInsert, tabStashes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface TabData {
  title: string;
  url: string;
  favicon?: string;
  windowId: number;
  pinned: boolean;
}

interface CreateTabStashData {
  windowId: string;
  urls: string[];
  tabsData?: TabData[];
}

type UpdateTabStashData = Partial<CreateTabStashData>;

export const tabStashService = {
  /**
   * Get tab stashes for a user
   */
  getTabStashes: async (userId: string): Promise<TabStash[]> => {
    // Return all tab stashes including soft-deleted ones for proper CRDT sync
    // The frontend will filter out deleted items as needed
    return await db
      .select()
      .from(tabStashes)
      .where(eq(tabStashes.userId, userId));
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
      tabsData: data.tabsData || null,
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
      creates: Array<{ clientId?: string; windowId: string; urls: string[]; tabsData?: TabData[] }>;
      updates: Array<{ id?: string; clientId?: string; windowId?: string; urls?: string[]; tabsData?: TabData[] }>;
      deletes: Array<{ id?: string; clientId?: string }>;
    }
  ): Promise<{ created: Array<TabStash & { clientId?: string }>; updated: TabStash[]; deleted: string[] }> => {
    // Use a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      const created: Array<TabStash & { clientId?: string }> = [];
      const updated: TabStash[] = [];
      const deleted: string[] = [];
      const idMap = new Map<string, string>();

      try {
        // Process creates
        for (const c of payload.creates || []) {
          const ts = await tabStashService.createTabStash(userId, c);
          if (c.clientId) idMap.set(c.clientId, ts.id);
          created.push({ ...ts, clientId: c.clientId });
        }

        // Process updates
        for (const u of payload.updates || []) {
          const resolvedId = (u as any).id || ((u as any).clientId && idMap.get((u as any).clientId as string));
          if (!resolvedId) continue;
          
          try {
            const ts = await tabStashService.updateTabStash(resolvedId, userId, u);
            updated.push(ts);
          } catch (err) {
            // Skip if not found
            console.warn(`Tab stash ${resolvedId} not found for update`);
          }
        }

        // Process deletes
        for (const d of payload.deletes || []) {
          const resolvedId = (d as any).id || ((d as any).clientId && idMap.get((d as any).clientId as string));
          if (!resolvedId) continue;
          
          try {
            await db
              .update(tabStashes)
              .set({ deletedAt: new Date() } as any)
              .where(and(eq(tabStashes.id, resolvedId), eq(tabStashes.userId, userId)));
            deleted.push(resolvedId);
          } catch (err) {
            // Skip if not found
            console.warn(`Tab stash ${resolvedId} not found for delete`);
          }
        }

        return { created, updated, deleted };
      } catch (error) {
        // Transaction will be rolled back automatically
        console.error("Tab stash bulk sync failed, rolling back:", error);
        throw error;
      }
    });
  },
};
