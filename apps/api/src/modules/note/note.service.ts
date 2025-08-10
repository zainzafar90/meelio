import { db } from "@/db";
import { notes, providers } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";
import { Note, NoteInsert } from "@/db/schema/note.schema";

export const noteService = {
  /**
   * Get all notes for full sync
   */
  getNotes: async (userId: string) => {
    // Default to Meelio provider notes for now
    const defaultProvider = await db.query.providers.findFirst({
      where: eq(providers.name, "meelio"),
    });
    const conditions = [eq(notes.userId, userId)];
    if (defaultProvider) conditions.push(eq(notes.providerId, defaultProvider.id));

    return await db.query.notes.findMany({
      where: and(...conditions),
      orderBy: [desc(notes.updatedAt)],
    });
  },

  /**
   * Bulk sync operation - handles creates, updates, and deletes
   */
  bulkSync: async (
    userId: string,
    payload: {
      creates: Array<{ clientId?: string; title: string; content?: string | null; categoryId?: string | null; providerId?: string | null; updatedAt?: Date }>;
      updates: Array<{ id?: string; clientId?: string; title?: string; content?: string | null; categoryId?: string | null; providerId?: string | null; updatedAt?: Date; deletedAt?: Date | null }>;
      deletes: Array<{ id?: string; clientId?: string; deletedAt?: Date }>;
    }
  ): Promise<{ created: Array<Note & { clientId?: string }>; updated: Note[]; deleted: string[] }> => {
    return await db.transaction(async () => {
      const created: Array<Note & { clientId?: string }> = [];
      const updated: Note[] = [];
      const deleted: string[] = [];
      const idMap = new Map<string, string>();

      // creates
      for (const c of payload.creates || []) {
        const note = await noteService._createNote(userId, c as any);
        if (c.clientId) idMap.set(c.clientId, note.id);
        created.push({ ...note, clientId: c.clientId });
      }

      // collapse updates by updatedAt
      const updateById = new Map<string, any>();
      for (const u of payload.updates || []) {
        const resolvedId = u.id || (u.clientId && idMap.get(u.clientId));
        if (!resolvedId) continue;
        const prev = updateById.get(resolvedId);
        if (!prev || ((u as any).updatedAt ?? 0) >= ((prev as any).updatedAt ?? 0)) {
          updateById.set(resolvedId, u);
        }
      }

      for (const [resolvedId, u] of updateById) {
        try {
          const note = await noteService._updateNote(resolvedId as string, userId, u as any);
          updated.push(note);
        } catch (err) {
          // ignore missing
        }
      }

      for (const d of payload.deletes || []) {
        const resolvedId = d.id || (d.clientId && idMap.get(d.clientId));
        if (!resolvedId) continue;
        try {
          await db
            .update(notes)
            .set({ deletedAt: d.deletedAt ?? new Date() } as any)
            .where(and(eq(notes.id, resolvedId), eq(notes.userId, userId)));
          deleted.push(resolvedId);
        } catch (err) {
          // ignore
        }
      }

      return { created, updated, deleted };
    });
  },

  // Internal methods for bulk operations
  _createNote: async (userId: string, data: any): Promise<Note> => {
    // Enforce hard business limits
    const existingCount = await db.query.notes.findMany({ where: and(eq(notes.userId, userId), eq(notes.deletedAt, null as any)) });
    if (existingCount.length >= 500) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Maximum notes limit (500) reached");
    }
    if (typeof data.content === "string" && data.content.length > 10000) {
      data.content = data.content.slice(0, 10000);
    }
    const result = await db
      .insert(notes)
      .values({
        userId,
        title: data.title,
        content: data.content ?? null,
        categoryId: data.categoryId ?? undefined,
        providerId: data.providerId ?? (await (async () => {
          const p = await db.query.providers.findFirst({ where: eq(providers.name, "meelio") });
          return p?.id;
        })()),
      } as NoteInsert)
      .returning();

    return result[0];
  },

  _updateNote: async (id: string, userId: string, data: any): Promise<Note> => {
    // Check if note exists first
    const existing = await db.query.notes.findFirst({
      where: and(eq(notes.id, id), eq(notes.userId, userId))
    });
    if (!existing) {
      throw new ApiError(httpStatus.NOT_FOUND, "Note not found");
    }

    const updateData: any = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.content !== undefined) {
      updateData.content = typeof data.content === "string" ? data.content.slice(0, 10000) : data.content;
    }

    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId;
    }

    if (data.deletedAt !== undefined) {
      updateData.deletedAt = data.deletedAt;
    }

    const result = await db
      .update(notes)
      .set(updateData)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();

    return result[0];
  },
};