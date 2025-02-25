import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

/**
 * Get notes for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object[]>} The notes
 */
export const getNotes = async (userId: string) => {
  return await db.select().from(notes).where(eq(notes.userId, userId));
};

/**
 * Get a note by ID
 * @param {string} id - The note ID
 * @param {string} userId - The user ID
 * @returns {Promise<object>} The note
 */
export const getNoteById = async (id: string, userId: string) => {
  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));

  if (result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "Note not found");
  }

  return result[0];
};

/**
 * Create a note
 * @param {string} userId - The user ID
 * @param {object} data - The note data
 * @returns {Promise<object>} The created note
 */
export const createNote = async (userId: string, data: any) => {
  const result = await db
    .insert(notes)
    .values({
      userId,
      title: data.title,
      content: data.content,
    })
    .returning();

  return result[0];
};

/**
 * Update a note
 * @param {string} id - The note ID
 * @param {string} userId - The user ID
 * @param {object} data - The note data
 * @returns {Promise<object>} The updated note
 */
export const updateNote = async (id: string, userId: string, data: any) => {
  // Check if note exists
  await getNoteById(id, userId);

  const updateData: any = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.content !== undefined) {
    updateData.content = data.content;
  }

  const result = await db
    .update(notes)
    .set(updateData)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();

  return result[0];
};

/**
 * Delete a note
 * @param {string} id - The note ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const deleteNote = async (id: string, userId: string) => {
  // Check if note exists
  await getNoteById(id, userId);

  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
};
