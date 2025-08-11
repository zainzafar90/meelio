import { db } from "@/db";
import { Task, tasks, providers } from "@/db/schema";
import { eq, and, asc, isNull } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";
import { parseNullableDate } from "@/common/utils/date";

interface TaskUpdateData {
  title?: string;
  completed?: boolean;
  pinned?: boolean;
  dueDate?: string | number | null;
  updatedAt?: Date;
  categoryId?: string | null;
  providerId?: string | null;
  deletedAt?: Date | null;
}

export const tasksService = {
  /**
   * Get all tasks for a user (used for full sync)
   */
  async getTasks(userId: string): Promise<Task[]> {
    const defaultProvider = await db.query.providers.findFirst({
      where: eq(providers.name, "meelio"),
    });
    
    if (!defaultProvider) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Default provider not found");
    }
    
    const result = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.providerId, defaultProvider.id),
          isNull(tasks.deletedAt)
        )
      )
      .orderBy(asc(tasks.createdAt));

    return result as any;
  },

  /**
   * Bulk sync operation for tasks
   * Handles creates, updates, and deletes in a single transaction
   */
  async bulkSync(
    userId: string,
    payload: {
      creates: Array<{ 
        clientId?: string; 
        title: string; 
        completed?: boolean; 
        pinned?: boolean; 
        dueDate?: string | number | null; 
        categoryId?: string | null; 
        providerId?: string | null; 
        updatedAt?: Date 
      }>;
      updates: Array<({ id?: string; clientId?: string }) & TaskUpdateData>;
      deletes: Array<{ id?: string; clientId?: string; deletedAt?: Date }>;
    }
  ): Promise<{ created: Array<Task & { clientId?: string }>; updated: Task[]; deleted: string[] }> {
    return await db.transaction(async () => {
      const created: Array<Task & { clientId?: string }> = [];
      const updated: Task[] = [];
      const deleted: string[] = [];
      const idMap = new Map<string, string>();

      try {
        // Process creates
        for (const c of payload.creates || []) {
          const task = await this._createTask(userId, {
            title: c.title,
            completed: c.completed,
            pinned: c.pinned,
            dueDate: c.dueDate ?? undefined,
            categoryId: c.categoryId ?? undefined,
            providerId: c.providerId ?? undefined,
          });
          if (c.clientId) idMap.set(c.clientId, task.id);
          created.push({ ...task, clientId: c.clientId });
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
            const task = await this._updateTask(userId, resolvedId as string, u as any);
            updated.push(task);
          } catch (err) {
            console.warn(`Task ${resolvedId} not found for update`);
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
              .update(tasks)
              .set({ deletedAt: delAt } as Task)
              .where(and(eq(tasks.id, resolvedId), eq(tasks.userId, userId)));
            deleted.push(resolvedId);
          } catch (err) {
            console.warn(`Task ${resolvedId} not found for delete`);
          }
        }

        return { created, updated, deleted };
      } catch (error) {
        console.error("Tasks bulk sync failed, rolling back:", error);
        throw error;
      }
    });
  },

  // Private helper methods for bulk sync
  async _createTask(
    userId: string,
    taskData: {
      title: string;
      completed?: boolean;
      pinned?: boolean;
      dueDate?: string | number | null | undefined;
      categoryId?: string | null | undefined;
      providerId?: string | null | undefined;
    }
  ): Promise<Task> {
    if (!taskData.title?.trim()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Title is required");
    }

    const parsedDueDate = parseNullableDate(taskData.dueDate, "dueDate");
    const insertData: any = {
      userId,
      title: taskData.title,
      completed: taskData.completed ?? false,
      pinned: taskData.pinned ?? false,
    };

    if (parsedDueDate !== undefined) {
      insertData.dueDate = parsedDueDate;
    }

    if (taskData.categoryId !== undefined) {
      insertData.categoryId = taskData.categoryId;
    }

    if (taskData.providerId !== undefined) {
      insertData.providerId = taskData.providerId;
    } else {
      const defaultProvider = await db.query.providers.findFirst({
        where: eq(providers.name, "meelio"),
      });
      if (defaultProvider) {
        insertData.providerId = defaultProvider.id;
      }
    }

    // Handle pinned task logic - only one can be pinned
    if (insertData.pinned) {
      await db
        .update(tasks)
        .set({ pinned: false } as Task)
        .where(and(eq(tasks.userId, userId), eq(tasks.pinned, true)));
    }

    const result = await db.insert(tasks).values(insertData).returning();
    return result[0];
  },

  async _updateTask(
    userId: string,
    taskId: string,
    updateData: TaskUpdateData
  ): Promise<Task> {
    // Load current task for conflict handling
    const current = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    });

    if (!current) {
      throw new ApiError(httpStatus.NOT_FOUND, "Task not found");
    }

    const data: Partial<Task> = {};

    // Build update data
    if (updateData.title !== undefined) {
      data.title = updateData.title;
    }

    if (updateData.completed !== undefined) {
      data.completed = updateData.completed;
    }

    if (updateData.pinned !== undefined) {
      data.pinned = updateData.pinned;
    }

    if (updateData.deletedAt !== undefined) {
      const parsed = parseNullableDate(updateData.deletedAt as any, "deletedAt");
      if (parsed !== undefined) {
        data.deletedAt = parsed;
      }
    }

    if (updateData.dueDate !== undefined) {
      const parsedDate = parseNullableDate(updateData.dueDate, "dueDate");
      if (parsedDate !== undefined) {
        data.dueDate = parsedDate;
      }
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

    // Handle pinned task logic
    if (updateData.pinned !== undefined && updateData.pinned) {
      await db
        .update(tasks)
        .set({ pinned: false } as Task)
        .where(and(eq(tasks.userId, userId), eq(tasks.pinned, true)));
    }

    const result = await db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    if (!result.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Task not found");
    }

    return result[0];
  },
};