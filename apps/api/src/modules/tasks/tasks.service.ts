import { db } from "@/db";
import { Task, tasks, providers } from "@/db/schema";
import { eq, and, desc, asc, isNull } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";
import { parseNullableDate } from "@/common/utils/date";
import { tasksSyncService } from "./tasks-sync.service";


interface TaskFilters {
  completed?: boolean;
  dueDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

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
   * Get tasks for a user with optional filters
   */
  async getTasks(
    userId: string,
    filters: TaskFilters 
  ): Promise<Task[]> {
    const defaultProvider = await db.query.providers.findFirst({
      where: eq(providers.name, "meelio"),
    });
    if (!defaultProvider) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Default provider not found");
    }
    const conditions = [eq(tasks.userId, userId), eq(tasks.providerId, defaultProvider?.id)];

    // Exclude soft-deleted by default unless explicitly requested
    const where = and(...conditions, isNull(tasks.deletedAt));

    const result = await db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(asc(tasks.createdAt));

    return result as any;
  },

  /**
   * Get a specific task by ID
   */
  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await db.query.tasks.findFirst(
      {
        where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
      }
    )

    if (!task) {
      throw new ApiError(httpStatus.NOT_FOUND, "Task not found");
    }

    return task;
  },


  /**
   * Create a new task
   */
  async createTask(
    userId: string,
    taskData: Omit<TaskUpdateData, "updatedAt"> & { title: string }
  ): Promise<Task> {
    if (!taskData.title?.trim()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Title is required");
    }

    const parsedDueDate = tasksService.parseDate(taskData.dueDate);
    const insertData: any = {
      userId,
      title: taskData.title,
      completed: taskData.completed ?? false,
      pinned: taskData.pinned ?? false,
    };

    // Only include dueDate if it's explicitly set
    if (parsedDueDate !== undefined) {
      insertData.dueDate = parsedDueDate;
    }

    // Handle categoryId
    if (taskData.categoryId !== undefined) {
      insertData.categoryId = taskData.categoryId;
    }

    // Handle providerId - if not provided, use default "meelio" provider
    if (taskData.providerId !== undefined) {
      insertData.providerId = taskData.providerId;
    } else {
      // Get the default "meelio" provider
      const [meelioProvider] = await db
        .select()
        .from(providers)
        .where(eq(providers.name, "meelio"))
        .limit(1);

      if (meelioProvider) {
        insertData.providerId = meelioProvider.id;
      }
    }

    // Handle pinned task logic
    if (insertData.pinned) {
      await tasksService._handlePinnedTask(userId, true);
    }

    const result = await db.insert(tasks).values(insertData).returning();
    return result[0];
  },

  /**
   * Parse and validate due date
   */
  parseDate(dueDate: string | number | null | undefined): Date | null | undefined {
    return parseNullableDate(dueDate, "dueDate");
  },

  /**
   * Handle pinned task logic - ensure only one task is pinned per user
   */
  async _handlePinnedTask(userId: string, isPinned: boolean): Promise<void> {
    if (isPinned) {
      await db
        .update(tasks)
        .set({ pinned: false } as Task)
        .where(and(eq(tasks.userId, userId), eq(tasks.pinned, true)));
    }
  },

  /**
   * Build update data object from input
   */
  _buildUpdateData(updateData: TaskUpdateData): Partial<Task> {
    const data: Partial<Task> = {};

    // Handle each field explicitly for better type safety
    if (updateData.title !== undefined) {
      data.title = updateData.title;
    }

    if (updateData.completed !== undefined) {
      data.completed = updateData.completed;
    }

    if (updateData.pinned !== undefined) {
      data.pinned = updateData.pinned;
    }


    if (updateData.updatedAt !== undefined) {
      // updatedAt is server-managed; ignore client value
      // kept for LWW checks elsewhere
    }
    
    if (updateData.deletedAt !== undefined) {
      const parsed = tasksService.parseDate(updateData.deletedAt as any);
      if (parsed !== undefined) {
        data.deletedAt = parsed;
      }
    }

    if (updateData.dueDate !== undefined) {
      const parsedDate = tasksService.parseDate(updateData.dueDate);
      // Only set dueDate if parsing was successful or explicitly null
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

    // ensure we never set updatedAt from client
    delete (data as any).updatedAt;

    return data;
  },

  /**
   * Update an existing task
   */
  async updateTask(
    userId: string,
    taskId: string,
    updateData: TaskUpdateData
  ): Promise<Task> {
    // Load current for conflict handling
    const current = await this.getTaskById(userId, taskId);

    // Build update data
    const data = tasksService._buildUpdateData(updateData);

    // Conflict handling: delete precedence with LWW by timestamp
    // If the row is tombstoned and incoming update is not strictly newer than deletedAt, ignore update
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

    // Validate we have something to update
    if (Object.keys(data).length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No valid update data provided"
      );
    }

    // Handle pinned task logic
    if (updateData.pinned !== undefined) {
      await tasksService._handlePinnedTask(userId, updateData.pinned);
    }

    // Perform update
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

  /**
   * Delete a task
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    // Verify task exists
    await this.getTaskById(userId, taskId);

    // Soft delete: set deletedAt
    await db
      .update(tasks)
      .set({ deletedAt: new Date() } as Task)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  },

  /**
   * Bulk sync operation - delegate to sync service
   */
  async bulkSync(
    userId: string,
    payload: {
      creates: Array<{ clientId?: string; title: string; completed?: boolean; pinned?: boolean; dueDate?: string | number | null; categoryId?: string | null; providerId?: string | null; updatedAt?: Date }>;
      updates: Array<({ id?: string; clientId?: string }) & TaskUpdateData>;
      deletes: Array<{ id?: string; clientId?: string; deletedAt?: Date }>;
    }
  ): Promise<{ created: Array<Task & { clientId?: string }>; updated: Task[]; deleted: string[] }> {
    return tasksSyncService.bulkSync(userId, payload);
  },

};
