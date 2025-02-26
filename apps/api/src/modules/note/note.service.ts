import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";
import { Note, NoteInsert } from "@/db/schema/note.schema";

export const noteService = {
  getNotes: async (userId: string) => {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  },

  getNoteById: async (id: string, userId: string) => {
    const result = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));

    if (result.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Note not found");
    }

    return result[0];
  },

  createNote: async (userId: string, data: any): Promise<Note> => {
    const result = await db
      .insert(notes)
      .values({
        userId,
        title: data.title,
        content: data.content ?? null,
      } as NoteInsert)
      .returning();

    return result[0];
  },

  updateNote: async (id: string, userId: string, data: any): Promise<Note> => {
    // Check if note exists
    await noteService.getNoteById(id, userId);

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
  },

  deleteNote: async (id: string, userId: string) => {
    // Check if note exists
    await noteService.getNoteById(id, userId);

    await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
  },
};
