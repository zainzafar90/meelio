import { db } from "@/db";
import { siteBlockers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

/**
 * Get site blockers for a user
 * @param {string} userId - The user ID
 * @param {string} [category] - Optional category filter
 * @returns {Promise<object[]>} The site blockers
 */
export const getSiteBlockers = async (userId: string, category?: string) => {
  if (category) {
    return await db
      .select()
      .from(siteBlockers)
      .where(
        and(
          eq(siteBlockers.userId, userId),
          eq(siteBlockers.category, category)
        )
      );
  }

  return await db
    .select()
    .from(siteBlockers)
    .where(eq(siteBlockers.userId, userId));
};

/**
 * Get a site blocker by ID
 * @param {string} id - The site blocker ID
 * @param {string} userId - The user ID
 * @returns {Promise<object>} The site blocker
 */
export const getSiteBlockerById = async (id: string, userId: string) => {
  const result = await db
    .select()
    .from(siteBlockers)
    .where(and(eq(siteBlockers.id, id), eq(siteBlockers.userId, userId)));

  if (result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "Site blocker not found");
  }

  return result[0];
};

/**
 * Create a site blocker
 * @param {string} userId - The user ID
 * @param {object} data - The site blocker data
 * @returns {Promise<object>} The created site blocker
 */
export const createSiteBlocker = async (userId: string, data: any) => {
  const insertData: any = {
    userId,
    url: data.url,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (data.category) {
    insertData.category = data.category;
  }

  const result = await db.insert(siteBlockers).values(insertData).returning();

  return result[0];
};

/**
 * Update a site blocker
 * @param {string} id - The site blocker ID
 * @param {string} userId - The user ID
 * @param {object} data - The site blocker data
 * @returns {Promise<object>} The updated site blocker
 */
export const updateSiteBlocker = async (
  id: string,
  userId: string,
  data: any
) => {
  // Check if site blocker exists
  await getSiteBlockerById(id, userId);

  const updateData: any = {
    updatedAt: new Date(),
  };

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
};

/**
 * Delete a site blocker
 * @param {string} id - The site blocker ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const deleteSiteBlocker = async (id: string, userId: string) => {
  // Check if site blocker exists
  await getSiteBlockerById(id, userId);

  await db
    .delete(siteBlockers)
    .where(and(eq(siteBlockers.id, id), eq(siteBlockers.userId, userId)));
};
