import { db } from "@/db";
import { SiteBlocker, SiteBlockerInsert, siteBlockers } from "@/db/schema/site-blocker.schema";
import { eq, and, isNull } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

export const siteBlockerService = {
  /**
   * Get site blockers for a user
   */
  getSiteBlockers: async (
    userId: string,
    category?: string,
  ): Promise<SiteBlocker[]> => {
    const conditions = [eq(siteBlockers.userId, userId)];
    
    if (category) {
      conditions.push(eq(siteBlockers.category, category));
    }

    return await db
      .select()
      .from(siteBlockers)
      .where(and(...conditions, isNull(siteBlockers.deletedAt)));
  },

  /**
   * Get a site blocker by ID
   */
  getSiteBlockerById: async (
    id: string,
    userId: string
  ): Promise<SiteBlocker> => {
    const result = await db
      .select()
      .from(siteBlockers)
      .where(and(eq(siteBlockers.id, id), eq(siteBlockers.userId, userId)));

    if (result.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Site blocker not found");
    }

    return result[0];
  },

  /**
   * Create or toggle a site blocker
   */
  createSiteBlocker: async (
    userId: string,
    data: any
  ): Promise<SiteBlocker | null> => {
    // Normalize URL to prevent duplicates
    const normalizedUrl = data.url
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .toLowerCase();

    const existingSite = await db
      .select()
      .from(siteBlockers)
      .where(
        and(
          eq(siteBlockers.userId, userId),
          eq(siteBlockers.url, normalizedUrl)
        )
      );

    if (existingSite.length > 0) {
      const [updated] = await db
        .update(siteBlockers)
        .set({ isBlocked: data.isBlocked !== undefined ? data.isBlocked : true, deletedAt: null, updatedAt: new Date() } as SiteBlocker)
        .where(
          and(
            eq(siteBlockers.userId, userId),
            eq(siteBlockers.url, normalizedUrl)
          )
        )
        .returning();
      return updated ?? null;
    }

    const insertData = {
      userId,
      url: normalizedUrl,
      category: data.category,
      isBlocked: data.isBlocked !== undefined ? data.isBlocked : true,
    };

    const result = await db.insert(siteBlockers).values(insertData).returning();

    return result[0];
  },

  /**
   * Update a site blocker
   */
  updateSiteBlocker: async (
    id: string,
    userId: string,
    data: any
  ): Promise<SiteBlocker> => {
    await siteBlockerService.getSiteBlockerById(id, userId);

    const updateData = {} as Partial<SiteBlocker>;

    if (data.url) {
      updateData.url = data.url;
    }

    if (data.category !== undefined) {
      updateData.category = data.category;
    }
    if (data.isBlocked !== undefined) {
      (updateData as any).isBlocked = data.isBlocked;
      if (data.isBlocked === true) {
        (updateData as any).deletedAt = null;
      } else {
        (updateData as any).deletedAt = new Date();
      }
    }


    const result = await db
      .update(siteBlockers)
      .set(updateData)
      .where(and(eq(siteBlockers.id, id), eq(siteBlockers.userId, userId)))
      .returning();

    return result[0];
  },

  /**
   * Delete a site blocker
   */
  deleteSiteBlocker: async (id: string, userId: string): Promise<void> => {
    // Check if site blocker exists
    await siteBlockerService.getSiteBlockerById(id, userId);

    await db
      .update(siteBlockers)
      .set({ isBlocked: false, deletedAt: new Date(), updatedAt: new Date() } as SiteBlocker)
      .where(and(eq(siteBlockers.id, id), eq(siteBlockers.userId, userId)));
  },

  bulkSync: async (
    userId: string,
    payload: {
      creates: Array<{ clientId?: string; url: string; category?: string; isBlocked?: boolean }>;
      deletes: Array<{ id?: string; clientId?: string }>;
    }
  ): Promise<{ created: Array<SiteBlocker & { clientId?: string }>; updated: SiteBlocker[]; deleted: string[] }> => {
    const created: Array<SiteBlocker & { clientId?: string }> = [];
    const updated: SiteBlocker[] = [];
    const deleted: string[] = [];

    const idMap = new Map<string, string>();
    for (const c of payload.creates || []) {
      const res = await siteBlockerService.createSiteBlocker(userId, c);
      if (res) {
        if (c.clientId) idMap.set(c.clientId, res.id);
        created.push({ ...res, clientId: c.clientId });
      }
    }

    for (const d of payload.deletes || []) {
      const resolvedId = d.id || (d.clientId && idMap.get(d.clientId));
      if (!resolvedId) continue;
      await siteBlockerService.deleteSiteBlocker(resolvedId, userId);
      deleted.push(resolvedId);
    }

    return { created, updated, deleted };
  },
};
