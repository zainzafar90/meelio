import { db } from "@/db";
import { Task, tasks, providers, } from "@/db/schema";
import { eq, and, desc, asc, } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";


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
  async getTasks(userId: string, filters: TaskFilters): Promise<Task[]> {
    const defaultProvider = await db.query.providers.findFirst({
      where: eq(providers.name, "meelio"),
    });
    if (!defaultProvider) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Default provider not found");
    }
    const conditions = [eq(tasks.userId, userId), eq(tasks.providerId, defaultProvider?.id)];

    const result = db.query.tasks.findMany({
      where: and(...conditions, eq(tasks.deletedAt, null)),
      orderBy: filters.sortBy
        ? [filters.sortOrder === "desc" ? desc(tasks[filters.sortBy]) : asc(tasks[filters.sortBy])]
        : [desc(tasks.createdAt)],
    });

    return result;
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
  parseDate(
    dueDate: string | number | null | undefined
  ): Date | null | undefined {
    if (dueDate === undefined) return undefined;
    if (dueDate === null) return null;

    try {
      // Handle both ISO strings and timestamps (getTime() values)
      const parsedDate =
        typeof dueDate === "number" ? new Date(dueDate) : new Date(dueDate);

      // Check if the date is valid
      if (isNaN(parsedDate.getTime())) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Invalid date format: ${dueDate}`
        );
      }

      return parsedDate;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid date format: ${dueDate}`
      );
    }
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
      data.updatedAt = updateData.updatedAt;
    }
    
    if (updateData.deletedAt !== undefined) {
      data.deletedAt = updateData.deletedAt;
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

    delete data.updatedAt;

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
    // Verify task exists
    await this.getTaskById(userId, taskId);

    // Build update data
    const data = tasksService._buildUpdateData(updateData);

    console.log({ data });

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

  async bulkSync(
    userId: string,
    payload: {
      creates: Array<{ title: string; completed?: boolean; pinned?: boolean; dueDate?: string | number | null; categoryId?: string | null; providerId?: string | null; updatedAt?: Date }>;
      updates: Array<{ id: string } & TaskUpdateData>;
      deletes: Array<{ id: string; deletedAt?: Date }>;
    }
  ): Promise<{ created: Task[]; updated: Task[]; deleted: string[] }> {
    const created: Task[] = [];
    const updated: Task[] = [];
    const deleted: string[] = [];

    for (const c of payload.creates || []) {
      const task = await tasksService.createTask(userId, {
        title: c.title,
        completed: c.completed,
        pinned: c.pinned,
        dueDate: c.dueDate ?? undefined,
        categoryId: c.categoryId ?? undefined,
        providerId: c.providerId ?? undefined,
      });
      created.push(task);
    }

    for (const u of payload.updates || []) {
      const task = await tasksService.updateTask(userId, u.id, u);
      updated.push(task);
    }

    for (const d of payload.deletes || []) {
      await db
        .update(tasks)
        .set({ deletedAt: d.deletedAt ?? new Date() } as Task)
        .where(and(eq(tasks.id, d.id), eq(tasks.userId, userId)));
      deleted.push(d.id);
    }

    return { created, updated, deleted };
  },

};
