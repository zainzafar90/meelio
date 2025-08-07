import { db } from "@/db";
import { SiteBlocker, SiteBlockerInsert, siteBlockers } from "@/db/schema/site-blocker.schema";
import { eq, and } from "drizzle-orm";
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
      .where(and(...conditions, eq(siteBlockers.deletedAt, null)));
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
      // Remove the existing site blocker
      await db
        .update(siteBlockers)
        .set({ deletedAt: new Date() } as any)
        .where(
          and(
            eq(siteBlockers.userId, userId),
            eq(siteBlockers.url, normalizedUrl)
          )
        );
      return null;
    }

    const insertData = {
      userId,
      url: normalizedUrl,
      category: data.category,
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
      .set({ deletedAt: new Date() } as SiteBlocker)
      .where(and(eq(siteBlockers.id, id), eq(siteBlockers.userId, userId)));
  },

  bulkSync: async (
    userId: string,
    payload: {
      creates: Array<{ url: string; category?: string }>;
      deletes: Array<{ id: string }>;
    }
  ): Promise<{ created: SiteBlocker[]; deleted: string[] }> => {
    const created: SiteBlocker[] = [];
    const deleted: string[] = [];

    for (const c of payload.creates || []) {
      const res = await siteBlockerService.createSiteBlocker(userId, c);
      if (res) created.push(res);
    }

    for (const d of payload.deletes || []) {
      await siteBlockerService.deleteSiteBlocker(d.id, userId);
      deleted.push(d.id);
    }

    return { created, deleted };
  },
};
