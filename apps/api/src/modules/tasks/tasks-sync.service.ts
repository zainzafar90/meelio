import { db } from "@/db";
import { Task, tasks, providers } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";
import { parseNullableDate } from "@/common/utils/date";

interface BulkSyncPayload {
  creates: Array<{
    clientId?: string;
    title: string;
    completed?: boolean;
    pinned?: boolean;
    dueDate?: string | number | null;
    categoryId?: string | null;
    providerId?: string | null;
    updatedAt?: Date;
  }>;
  updates: Array<{
    id?: string;
    clientId?: string;
    title?: string;
    completed?: boolean;
    pinned?: boolean;
    dueDate?: string | number | null;
    categoryId?: string | null;
    providerId?: string | null;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }>;
  deletes: Array<{
    id?: string;
    clientId?: string;
    deletedAt?: Date;
  }>;
}

interface BulkSyncResult {
  created: Array<Task & { clientId?: string }>;
  updated: Task[];
  deleted: string[];
}

export class TasksSyncService {
  /**
   * Get default provider for tasks
   */
  private async getDefaultProvider() {
    const defaultProvider = await db.query.providers.findFirst({
      where: eq(providers.name, "meelio"),
    });
    if (!defaultProvider) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Default provider not found");
    }
    return defaultProvider;
  }

  /**
   * Parse and validate date
   */
  private parseDate(date: string | number | null | undefined): Date | null | undefined {
    return parseNullableDate(date, "date");
  }

  /**
   * Handle pinned task logic - ensure only one task is pinned per user
   */
  private async handlePinnedTask(userId: string, isPinned: boolean): Promise<void> {
    if (isPinned) {
      await db
        .update(tasks)
        .set({ pinned: false } as Task)
        .where(and(eq(tasks.userId, userId), eq(tasks.pinned, true)));
    }
  }

  /**
   * Build update data object from input
   */
  private buildUpdateData(updateData: any): Partial<Task> {
    const data: Partial<Task> = {};

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
      const parsed = this.parseDate(updateData.deletedAt);
      if (parsed !== undefined) {
        data.deletedAt = parsed;
      }
    }

    if (updateData.dueDate !== undefined) {
      const parsedDate = this.parseDate(updateData.dueDate);
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

    // Never set updatedAt from client
    delete (data as any).updatedAt;

    return data;
  }

  /**
   * Create a new task
   */
  private async createTask(
    userId: string,
    taskData: Omit<BulkSyncPayload['creates'][0], 'clientId'>
  ): Promise<Task> {
    if (!taskData.title?.trim()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Title is required");
    }

    const parsedDueDate = this.parseDate(taskData.dueDate);
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
      const defaultProvider = await this.getDefaultProvider();
      insertData.providerId = defaultProvider.id;
    }

    if (insertData.pinned) {
      await this.handlePinnedTask(userId, true);
    }

    const result = await db.insert(tasks).values(insertData).returning();
    return result[0];
  }

  /**
   * Update an existing task with LWW conflict resolution
   */
  private async updateTask(
    userId: string,
    taskId: string,
    updateData: BulkSyncPayload['updates'][0]
  ): Promise<Task> {
    // Load current task for conflict handling
    const current = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    });

    if (!current) {
      throw new ApiError(httpStatus.NOT_FOUND, "Task not found");
    }

    const data = this.buildUpdateData(updateData);

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

    if (updateData.pinned !== undefined) {
      await this.handlePinnedTask(userId, updateData.pinned);
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
  }

  /**
   * Bulk sync operation for tasks
   */
  async bulkSync(
    userId: string,
    payload: BulkSyncPayload
  ): Promise<BulkSyncResult> {
    return await db.transaction(async (tx) => {
      const created: Array<Task & { clientId?: string }> = [];
      const updated: Task[] = [];
      const deleted: string[] = [];
      const idMap = new Map<string, string>();

      try {
        // Process creates
        for (const c of payload.creates || []) {
          const task = await this.createTask(userId, c);
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
            const task = await this.updateTask(userId, resolvedId as string, u);
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
  }

  /**
   * Get all tasks for a user (for full sync)
   */
  async getAllTasks(userId: string): Promise<Task[]> {
    const defaultProvider = await this.getDefaultProvider();
    
    const result = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.providerId, defaultProvider.id),
          isNull(tasks.deletedAt)
        )
      );

    return result as any;
  }
}

export const tasksSyncService = new TasksSyncService();