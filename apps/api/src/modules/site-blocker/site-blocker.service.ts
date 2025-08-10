import { db } from "@/db";
import { SiteBlocker, siteBlockers } from "@/db/schema/site-blocker.schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface SiteBlockerUpdateData {
  url?: string;
  category?: string | null;
  isBlocked?: boolean;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export const siteBlockerService = {
  /**
   * Get all site blockers for a user (used for full sync)
   */
  async getSiteBlockers(userId: string): Promise<SiteBlocker[]> {
    const result = await db
      .select()
      .from(siteBlockers)
      .where(and(
        eq(siteBlockers.userId, userId),
        isNull(siteBlockers.deletedAt)
      ))
      .orderBy(desc(siteBlockers.createdAt));

    return result as any;
  },

  /**
   * Bulk sync operation for site blockers
   * Handles creates, updates, and deletes in a single transaction
   */
  async bulkSync(
    userId: string,
    payload: {
      creates: Array<{ 
        clientId?: string; 
        url: string; 
        category?: string | null; 
        isBlocked?: boolean;
        updatedAt?: Date
      }>;
      updates: Array<({ id?: string; clientId?: string }) & SiteBlockerUpdateData>;
      deletes: Array<{ id?: string; clientId?: string; deletedAt?: Date }>;
    }
  ): Promise<{ created: Array<SiteBlocker & { clientId?: string }>; updated: SiteBlocker[]; deleted: string[] }> {
    return await db.transaction(async () => {
      const created: Array<SiteBlocker & { clientId?: string }> = [];
      const updated: SiteBlocker[] = [];
      const deleted: string[] = [];
      const idMap = new Map<string, string>();

      try {
        // Process creates
        for (const c of payload.creates || []) {
          const siteBlocker = await this._createSiteBlocker(userId, {
            url: c.url,
            category: c.category ?? undefined,
            isBlocked: c.isBlocked ?? true,
          });
          if (c.clientId) idMap.set(c.clientId, siteBlocker.id);
          created.push({ ...siteBlocker, clientId: c.clientId });
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
            const siteBlocker = await this._updateSiteBlocker(userId, resolvedId as string, u as any);
            updated.push(siteBlocker);
          } catch (err) {
            console.warn(`Site blocker ${resolvedId} not found for update`);
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
              .update(siteBlockers)
              .set({ deletedAt: delAt } as SiteBlocker)
              .where(and(eq(siteBlockers.id, resolvedId), eq(siteBlockers.userId, userId)));
            deleted.push(resolvedId);
          } catch (err) {
            console.warn(`Site blocker ${resolvedId} not found for delete`);
          }
        }

        return { created, updated, deleted };
      } catch (error) {
        console.error("Site blockers bulk sync failed, rolling back:", error);
        throw error;
      }
    });
  },

  // Private helper methods for bulk sync
  async _createSiteBlocker(
    userId: string,
    siteBlockerData: {
      url: string;
      category?: string | null | undefined;
      isBlocked?: boolean;
    }
  ): Promise<SiteBlocker> {
    if (!siteBlockerData.url?.trim()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "URL is required");
    }

    // Normalize URL to prevent duplicates
    const normalizedUrl = siteBlockerData.url
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .toLowerCase()
      .trim();

    // Check if site already exists
    const existing = await db.query.siteBlockers.findFirst({
      where: and(
        eq(siteBlockers.userId, userId),
        eq(siteBlockers.url, normalizedUrl)
      ),
    });

    if (existing) {
      // Update existing site blocker instead of creating duplicate
      const updateData: Partial<SiteBlocker> = {
        isBlocked: siteBlockerData.isBlocked ?? true,
        deletedAt: null, // Clear soft delete when re-enabling
        updatedAt: new Date(),
      };

      if (siteBlockerData.category !== undefined) {
        updateData.category = siteBlockerData.category;
      }

      const result = await db
        .update(siteBlockers)
        .set(updateData)
        .where(and(eq(siteBlockers.id, existing.id), eq(siteBlockers.userId, userId)))
        .returning();

      return result[0];
    }

    // Enforce hard business limits
    const existingCount = await db.query.siteBlockers.findMany({ 
      where: and(eq(siteBlockers.userId, userId), isNull(siteBlockers.deletedAt)) 
    });
    if (existingCount.length >= 500) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Maximum site blockers limit (500) reached");
    }

    const insertData: any = {
      userId,
      url: normalizedUrl,
      category: siteBlockerData.category ?? null,
      isBlocked: siteBlockerData.isBlocked ?? true,
    };

    const result = await db.insert(siteBlockers).values(insertData).returning();
    return result[0];
  },

  async _updateSiteBlocker(
    userId: string,
    siteBlockerId: string,
    updateData: SiteBlockerUpdateData
  ): Promise<SiteBlocker> {
    // Load current site blocker for conflict handling
    const current = await db.query.siteBlockers.findFirst({
      where: and(eq(siteBlockers.id, siteBlockerId), eq(siteBlockers.userId, userId)),
    });

    if (!current) {
      throw new ApiError(httpStatus.NOT_FOUND, "Site blocker not found");
    }

    const data: Partial<SiteBlocker> = {};

    // Build update data
    if (updateData.url !== undefined) {
      const normalizedUrl = updateData.url
        .replace(/^(https?:\/\/)?(www\.)?/, "")
        .toLowerCase()
        .trim();
      if (!normalizedUrl) {
        throw new ApiError(httpStatus.BAD_REQUEST, "URL cannot be empty");
      }
      data.url = normalizedUrl;
    }

    if (updateData.category !== undefined) {
      data.category = updateData.category;
    }

    if (updateData.isBlocked !== undefined) {
      data.isBlocked = updateData.isBlocked;
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
      .update(siteBlockers)
      .set(data)
      .where(and(eq(siteBlockers.id, siteBlockerId), eq(siteBlockers.userId, userId)))
      .returning();

    if (!result.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Site blocker not found");
    }

    return result[0];
  },
};