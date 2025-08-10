import { db } from "@/db";
import { Note, notes, providers } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface NoteUpdateData {
  title?: string;
  content?: string | null;
  pinned?: boolean;
  updatedAt?: Date;
  categoryId?: string | null;
  providerId?: string | null;
  deletedAt?: Date | null;
}

export const noteService = {
  /**
   * Get all notes for a user (used for full sync)
   */
  async getNotes(userId: string): Promise<Note[]> {
    const defaultProvider = await db.query.providers.findFirst({
      where: eq(providers.name, "meelio"),
    });
    
    // Build where conditions - handle missing provider gracefully
    const conditions = [
      eq(notes.userId, userId),
      isNull(notes.deletedAt)
    ];
    
    if (defaultProvider) {
      conditions.push(eq(notes.providerId, defaultProvider.id));
    }
    
    const result = await db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.createdAt));

    return result as any;
  },

  /**
   * Bulk sync operation for notes
   * Handles creates, updates, and deletes in a single transaction
   */
  async bulkSync(
    userId: string,
    payload: {
      creates: Array<{ 
        clientId?: string; 
        title: string; 
        content?: string | null; 
        pinned?: boolean; 
        categoryId?: string | null; 
        providerId?: string | null; 
        updatedAt?: Date 
      }>;
      updates: Array<({ id?: string; clientId?: string }) & NoteUpdateData>;
      deletes: Array<{ id?: string; clientId?: string; deletedAt?: Date }>;
    }
  ): Promise<{ created: Array<Note & { clientId?: string }>; updated: Note[]; deleted: string[] }> {
    return await db.transaction(async () => {
      const created: Array<Note & { clientId?: string }> = [];
      const updated: Note[] = [];
      const deleted: string[] = [];
      const idMap = new Map<string, string>();

      try {
        // Process creates
        for (const c of payload.creates || []) {
          const note = await this._createNote(userId, {
            title: c.title,
            content: c.content,
            pinned: c.pinned,
            categoryId: c.categoryId ?? undefined,
            providerId: c.providerId ?? undefined,
          });
          if (c.clientId) idMap.set(c.clientId, note.id);
          created.push({ ...note, clientId: c.clientId });
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
            const note = await this._updateNote(userId, resolvedId as string, u as any);
            updated.push(note);
          } catch (err) {
            console.warn(`Note ${resolvedId} not found for update`);
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
              .update(notes)
              .set({ deletedAt: delAt } as Note)
              .where(and(eq(notes.id, resolvedId), eq(notes.userId, userId)));
            deleted.push(resolvedId);
          } catch (err) {
            console.warn(`Note ${resolvedId} not found for delete`);
          }
        }

        return { created, updated, deleted };
      } catch (error) {
        console.error("Notes bulk sync failed, rolling back:", error);
        throw error;
      }
    });
  },

  // Private helper methods for bulk sync
  async _createNote(
    userId: string,
    noteData: {
      title: string;
      content?: string | null | undefined;
      pinned?: boolean | undefined;
      categoryId?: string | null | undefined;
      providerId?: string | null | undefined;
    }
  ): Promise<Note> {
    if (!noteData.title?.trim()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Title is required");
    }

    // Enforce hard business limits
    const existingCount = await db.query.notes.findMany({ 
      where: and(eq(notes.userId, userId), isNull(notes.deletedAt)) 
    });
    if (existingCount.length >= 500) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Maximum notes limit (500) reached");
    }

    // Truncate content if too long
    const content = typeof noteData.content === "string" && noteData.content.length > 10000
      ? noteData.content.slice(0, 10000)
      : noteData.content;

    const insertData: any = {
      userId,
      title: noteData.title.trim(),
      content: content ?? null,
      pinned: noteData.pinned ?? false,
    };

    if (noteData.categoryId !== undefined) {
      insertData.categoryId = noteData.categoryId;
    }

    if (noteData.providerId !== undefined) {
      insertData.providerId = noteData.providerId;
    } else {
      const defaultProvider = await db.query.providers.findFirst({
        where: eq(providers.name, "meelio"),
      });
      if (defaultProvider) {
        insertData.providerId = defaultProvider.id;
      }
    }

    // Handle pinned note logic - only one can be pinned
    if (insertData.pinned) {
      await db
        .update(notes)
        .set({ pinned: false } as Note)
        .where(and(eq(notes.userId, userId), eq(notes.pinned, true)));
    }

    const result = await db.insert(notes).values(insertData).returning();
    return result[0];
  },

  async _updateNote(
    userId: string,
    noteId: string,
    updateData: NoteUpdateData
  ): Promise<Note> {
    // Load current note for conflict handling
    const current = await db.query.notes.findFirst({
      where: and(eq(notes.id, noteId), eq(notes.userId, userId)),
    });

    if (!current) {
      throw new ApiError(httpStatus.NOT_FOUND, "Note not found");
    }

    const data: Partial<Note> = {};

    // Build update data
    if (updateData.title !== undefined) {
      const trimmedTitle = updateData.title.trim();
      if (!trimmedTitle) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Title cannot be empty");
      }
      data.title = trimmedTitle;
    }

    if (updateData.content !== undefined) {
      // Truncate content if too long
      data.content = typeof updateData.content === "string" && updateData.content.length > 10000
        ? updateData.content.slice(0, 10000)
        : updateData.content;
    }

    if (updateData.pinned !== undefined) {
      data.pinned = updateData.pinned;
    }

    if (updateData.deletedAt !== undefined) {
      data.deletedAt = updateData.deletedAt;
    }

    if (updateData.categoryId !== undefined) {
      data.categoryId = updateData.categoryId;
    }

    if (updateData.providerId !== undefined) {
      data.providerId = updateData.providerId;
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

    // Handle pinned note logic
    if (updateData.pinned !== undefined && updateData.pinned) {
      await db
        .update(notes)
        .set({ pinned: false } as Note)
        .where(and(eq(notes.userId, userId), eq(notes.pinned, true)));
    }

    const result = await db
      .update(notes)
      .set(data)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    if (!result.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Note not found");
    }

    return result[0];
  },
};