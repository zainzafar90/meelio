import { db } from "@/db";
import { Task, tasks } from "@/db/schema";
import { eq, and, desc, asc, isNull, isNotNull } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface TaskFilters {
  completed?: boolean;
  category?: string;
  dueDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface TaskUpdateData {
  title?: string;
  completed?: boolean;
  pinned?: boolean;
  category?: string | null;
  dueDate?: string | number | null;
  updatedAt?: Date;
}

export const tasksService = {
  /**
   * Get tasks for a user with optional filters
   */
  async getTasks(userId: string, filters: TaskFilters): Promise<Task[]> {
    const conditions = [eq(tasks.userId, userId)];

    if (filters.completed !== undefined) {
      conditions.push(eq(tasks.completed, filters.completed));
    }

    if (filters.category) {
      conditions.push(eq(tasks.category, filters.category));
    }

    if (filters.dueDate) {
      if (filters.dueDate === "null") {
        conditions.push(isNull(tasks.dueDate));
      } else if (filters.dueDate === "not-null") {
        conditions.push(isNotNull(tasks.dueDate));
      } else {
        try {
          const dateObj = new Date(filters.dueDate);
          conditions.push(eq(tasks.dueDate, dateObj));
        } catch (error) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format");
        }
      }
    }

    const baseQuery = db
      .select()
      .from(tasks)
      .where(and(...conditions));

    if (filters.sortBy) {
      const orderFn = filters.sortOrder === "desc" ? desc : asc;
      let orderColumn;

      switch (filters.sortBy) {
        case "title":
          orderColumn = tasks.title;
          break;
        case "dueDate":
          orderColumn = tasks.dueDate;
          break;
        case "completed":
          orderColumn = tasks.completed;
          break;
        case "category":
          orderColumn = tasks.category;
          break;
        case "createdAt":
          orderColumn = tasks.createdAt;
          break;
        default:
          orderColumn = tasks.createdAt;
      }

      return await baseQuery.orderBy(orderFn(orderColumn));
    } else {
      return await baseQuery.orderBy(desc(tasks.createdAt));
    }
  },

  /**
   * Get a specific task by ID
   */
  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    if (!task.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Task not found");
    }

    return task[0];
  },

  /**
   * Get task categories for a user
   */
  async getCategories(userId: string): Promise<string[]> {
    const result = await db
      .selectDistinct({ category: tasks.category })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNotNull(tasks.category)));

    return result.map((r) => r.category).filter((c): c is string => c !== null);
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
      category: taskData.category ?? null,
    };

    // Only include dueDate if it's explicitly set
    if (parsedDueDate !== undefined) {
      insertData.dueDate = parsedDueDate;
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

    if (updateData.category !== undefined) {
      data.category = updateData.category;
    }

    if (updateData.updatedAt !== undefined) {
      data.updatedAt = updateData.updatedAt;
    }

    if (updateData.dueDate !== undefined) {
      const parsedDate = tasksService.parseDate(updateData.dueDate);
      // Only set dueDate if parsing was successful or explicitly null
      if (parsedDate !== undefined) {
        data.dueDate = parsedDate;
      }
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

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  },

  /**
   * Delete all tasks for a user in a category
   */
  async deleteTasksByCategory(userId: string, category: string): Promise<void> {
    await db
      .delete(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.category, category)));
  },
};
