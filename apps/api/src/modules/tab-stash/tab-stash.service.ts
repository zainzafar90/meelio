import { db } from "@/db";
import { tabStashes, type TabStashInsert } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

/**
 * Get tab stashes for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object[]>} The tab stashes
 */
export const getTabStashes = async (userId: string) => {
  return await db
    .select()
    .from(tabStashes)
    .where(eq(tabStashes.userId, userId));
};

/**
 * Get a tab stash by ID
 * @param {string} id - The tab stash ID
 * @param {string} userId - The user ID
 * @returns {Promise<object>} The tab stash
 */
export const getTabStashById = async (id: string, userId: string) => {
  const result = await db
    .select()
    .from(tabStashes)
    .where(and(eq(tabStashes.id, id), eq(tabStashes.userId, userId)));

  if (result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tab stash not found");
  }

  return result[0];
};

/**
 * Create a tab stash
 * @param {string} userId - The user ID
 * @param {object} data - The tab stash data
 * @returns {Promise<object>} The created tab stash
 */
export const createTabStash = async (userId: string, data: any) => {
  const tabStashData: TabStashInsert = {
    userId,
    windowId: data.windowId,
    urls: data.urls,
  };

  const result = await db.insert(tabStashes).values(tabStashData).returning();

  return result[0];
};

/**
 * Update a tab stash
 * @param {string} id - The tab stash ID
 * @param {string} userId - The user ID
 * @param {object} data - The tab stash data
 * @returns {Promise<object>} The updated tab stash
 */
export const updateTabStash = async (id: string, userId: string, data: any) => {
  // Check if tab stash exists
  await getTabStashById(id, userId);

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
};

/**
 * Delete a tab stash
 * @param {string} id - The tab stash ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const deleteTabStash = async (id: string, userId: string) => {
  // Check if tab stash exists
  await getTabStashById(id, userId);

  await db
    .delete(tabStashes)
    .where(and(eq(tabStashes.id, id), eq(tabStashes.userId, userId)));
};
