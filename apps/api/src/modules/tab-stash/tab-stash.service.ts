import { db } from "@/db";
import { TabStash, tabStashes } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface TabData {
  title: string;
  url: string;
  favicon?: string;
  windowId: number;
  pinned: boolean;
}

interface TabStashUpdateData {
  windowId?: string;
  urls?: string[];
  tabsData?: TabData[] | null;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export const tabStashService = {
  /**
   * Get all tab stashes for a user (used for full sync)
   */
  async getTabStashes(userId: string): Promise<TabStash[]> {
    const result = await db
      .select()
      .from(tabStashes)
      .where(and(
        eq(tabStashes.userId, userId),
        isNull(tabStashes.deletedAt)
      ))
      .orderBy(desc(tabStashes.createdAt));

    return result as any;
  },

  /**
   * Bulk sync operation for tab stashes
   * Handles creates, updates, and deletes in a single transaction
   */
  async bulkSync(
    userId: string,
    payload: {
      creates: Array<{ 
        clientId?: string; 
        windowId: string; 
        urls: string[]; 
        tabsData?: TabData[] | null;
        updatedAt?: Date
      }>;
      updates: Array<({ id?: string; clientId?: string }) & TabStashUpdateData>;
      deletes: Array<{ id?: string; clientId?: string; deletedAt?: Date }>;
    }
  ): Promise<{ created: Array<TabStash & { clientId?: string }>; updated: TabStash[]; deleted: string[] }> {
    return await db.transaction(async () => {
      const created: Array<TabStash & { clientId?: string }> = [];
      const updated: TabStash[] = [];
      const deleted: string[] = [];
      const idMap = new Map<string, string>();

      try {
        // Process creates
        for (const c of payload.creates || []) {
          const tabStash = await this._createTabStash(userId, {
            windowId: c.windowId,
            urls: c.urls,
            tabsData: c.tabsData ?? undefined,
          });
          if (c.clientId) idMap.set(c.clientId, tabStash.id);
          created.push({ ...tabStash, clientId: c.clientId });
        }

        // Collapse multiple updates to the same id to the last one by updatedAt
        const updateById = new Map<string, any>();
        for (const u of payload.updates || []) {
          const mappedId = u.clientId ? idMap.get(u.clientId) : undefined;
          const resolvedId = mappedId || u.id;
          if (!resolvedId) continue;
          
          const prev = updateById.get(resolvedId);
          if (!prev || ((u as any).updatedAt ?? 0) >= ((prev as any).updatedAt ?? 0)) {
            updateById.set(resolvedId, u);
          }
        }

        // Process updates with LWW + delete precedence
        for (const [resolvedId, u] of updateById) {
          try {
            const tabStash = await this._updateTabStash(userId, resolvedId as string, u as any);
            updated.push(tabStash);
          } catch (err) {
            console.warn(`Tab stash ${resolvedId} not found for update`);
          }
        }

        // Process deletes (set tombstone)
        for (const d of payload.deletes || []) {
          const mappedId = d.clientId ? idMap.get(d.clientId) : undefined;
          const resolvedId = mappedId || d.id;
          if (!resolvedId) {
            console.warn("Bulk delete skipped: no id or resolvable clientId", d);
            continue;
          }
          
          try {
            const delAt = d.deletedAt ? new Date(d.deletedAt as any) : new Date();
            await db
              .update(tabStashes)
              .set({ deletedAt: delAt } as TabStash)
              .where(and(eq(tabStashes.id, resolvedId), eq(tabStashes.userId, userId)));
            deleted.push(resolvedId);
          } catch (err) {
            console.warn(`Tab stash ${resolvedId} not found for delete`);
          }
        }

        return { created, updated, deleted };
      } catch (error) {
        console.error("Tab stashes bulk sync failed, rolling back:", error);
        throw error;
      }
    });
  },

  // Private helper methods for bulk sync
  async _createTabStash(
    userId: string,
    tabStashData: {
      windowId: string;
      urls: string[];
      tabsData?: TabData[] | null | undefined;
    }
  ): Promise<TabStash> {
    if (!tabStashData.windowId || !tabStashData.urls?.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "WindowId and urls are required");
    }

    // Enforce hard business limits
    const existingCount = await db.query.tabStashes.findMany({ 
      where: and(eq(tabStashes.userId, userId), isNull(tabStashes.deletedAt)) 
    });
    if (existingCount.length >= 100) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Maximum tab stashes limit (100) reached");
    }

    const insertData: any = {
      userId,
      windowId: tabStashData.windowId,
      urls: tabStashData.urls,
      tabsData: tabStashData.tabsData ?? null,
    };

    const result = await db.insert(tabStashes).values(insertData).returning();
    return result[0];
  },

  async _updateTabStash(
    userId: string,
    tabStashId: string,
    updateData: TabStashUpdateData
  ): Promise<TabStash> {
    // Load current tab stash for conflict handling
    const current = await db.query.tabStashes.findFirst({
      where: and(eq(tabStashes.id, tabStashId), eq(tabStashes.userId, userId)),
    });

    if (!current) {
      throw new ApiError(httpStatus.NOT_FOUND, "Tab stash not found");
    }

    const data: Partial<TabStash> = {};

    // Build update data
    if (updateData.windowId !== undefined) {
      data.windowId = updateData.windowId;
    }

    if (updateData.urls !== undefined) {
      data.urls = updateData.urls;
    }

    if (updateData.tabsData !== undefined) {
      data.tabsData = updateData.tabsData;
    }

    if (updateData.deletedAt !== undefined) {
      data.deletedAt = updateData.deletedAt;
    }

    // Conflict handling: delete precedence with LWW by timestamp
    const incomingUpdatedAt = updateData.updatedAt
      ? new Date(updateData.updatedAt)
      : undefined;
    
    if (current.deletedAt) {
      if (!incomingUpdatedAt || incomingUpdatedAt <= current.deletedAt) {
        // Keep deletion, ignore update
        return current;
      }
      // Newer update than deletion → resurrect by clearing deletedAt
      (data as any).deletedAt = null;
    }

    if (Object.keys(data).length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No valid update data provided"
      );
    }

    const result = await db
      .update(tabStashes)
      .set(data)
      .where(and(eq(tabStashes.id, tabStashId), eq(tabStashes.userId, userId)))
      .returning();

    if (!result.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Tab stash not found");
    }

    return result[0];
  },
};
