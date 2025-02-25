import { db } from "@/db";
import { focusSessions, type FocusSessionInsert } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

/**
 * Get focus sessions for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object[]>} The focus sessions
 */
export const getFocusSessions = async (userId: string) => {
  return await db
    .select()
    .from(focusSessions)
    .where(eq(focusSessions.userId, userId))
    .orderBy(desc(focusSessions.sessionStart));
};

/**
 * Get a focus session by ID
 * @param {string} id - The focus session ID
 * @param {string} userId - The user ID
 * @returns {Promise<object>} The focus session
 */
export const getFocusSessionById = async (id: string, userId: string) => {
  const result = await db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)));

  if (result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "Focus session not found");
  }

  return result[0];
};

/**
 * Create a focus session
 * @param {string} userId - The user ID
 * @param {object} data - The focus session data
 * @returns {Promise<object>} The created focus session
 */
export const createFocusSession = async (userId: string, data: any) => {
  const sessionData: FocusSessionInsert = {
    userId,
    sessionStart: new Date(data.sessionStart),
    sessionEnd: new Date(data.sessionEnd),
    duration: data.duration,
  };

  const result = await db.insert(focusSessions).values(sessionData).returning();

  return result[0];
};

/**
 * Update a focus session
 * @param {string} id - The focus session ID
 * @param {string} userId - The user ID
 * @param {object} data - The focus session data
 * @returns {Promise<object>} The updated focus session
 */
export const updateFocusSession = async (
  id: string,
  userId: string,
  data: any
) => {
  // Check if focus session exists
  await getFocusSessionById(id, userId);

  const updateData: Partial<FocusSessionInsert> = {};

  if (data.sessionStart) {
    updateData.sessionStart = new Date(data.sessionStart);
  }

  if (data.sessionEnd) {
    updateData.sessionEnd = new Date(data.sessionEnd);
  }

  if (data.duration) {
    updateData.duration = data.duration;
  }

  const result = await db
    .update(focusSessions)
    .set(updateData)
    .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)))
    .returning();

  return result[0];
};

/**
 * Delete a focus session
 * @param {string} id - The focus session ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const deleteFocusSession = async (id: string, userId: string) => {
  // Check if focus session exists
  await getFocusSessionById(id, userId);

  await db
    .delete(focusSessions)
    .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)));
};
