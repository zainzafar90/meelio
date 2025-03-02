import { db } from "@/db";
import { Task, TaskInsert, TaskStatus, tasks } from "@/db/schema";
import { eq, and, desc, asc, isNull, isNotNull, or, ne } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface TaskFilters {
  status?: TaskStatus;
  category?: string;
  isFocus?: boolean;
  dueDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const tasksService = {
  /**
   * Get tasks for a user with optional filters
   */
  async getTasks(userId: string, filters: TaskFilters): Promise<Task[]> {
    const conditions = [eq(tasks.userId, userId)];

    if (filters.status && Object.values(TaskStatus).includes(filters.status)) {
      conditions.push(eq(tasks.status, filters.status));
    }

    if (filters.category) {
      conditions.push(eq(tasks.category, filters.category));
    }

    if (filters.isFocus !== undefined) {
      conditions.push(eq(tasks.isFocus, filters.isFocus));
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
        case "status":
          orderColumn = tasks.status;
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
   * Get the current focus task
   */
  async getFocusTask(userId: string): Promise<Task> {
    const task = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.isFocus, true),
          or(
            eq(tasks.status, TaskStatus.PENDING),
            eq(tasks.status, TaskStatus.IN_PROGRESS)
          )
        )
      );

    if (!task.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "No focus task found");
    }

    return task[0];
  },

  /**
   * Create a new task
   */
  async createTask(userId: string, taskData: any): Promise<Task> {
    if (!taskData.title) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Title is required");
    }

    if (
      taskData.status &&
      !Object.values(TaskStatus).includes(taskData.status)
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Status must be one of: ${Object.values(TaskStatus).join(", ")}`
      );
    }

    let dueDateObj;
    if (taskData.dueDate) {
      try {
        dueDateObj = new Date(taskData.dueDate);
      } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format");
      }
    }

    if (taskData.isFocus) {
      await db
        .update(tasks)
        .set({ isFocus: false } as Task)
        .where(and(eq(tasks.userId, userId), eq(tasks.isFocus, true)));
    }

    const insertData = {
      userId,
      title: taskData.title,
      description: taskData.description ?? null,
      category: taskData.category ?? null,
      isFocus: taskData.isFocus ?? false,
      status: taskData.status ?? TaskStatus.PENDING,
      dueDate: dueDateObj || null,
    };

    const result = await db.insert(tasks).values(insertData).returning();
    return result[0];
  },

  /**
   * Update an existing task
   */
  async updateTask(
    userId: string,
    taskId: string,
    updateData: any
  ): Promise<Task> {
    const existingTask = await this.getTaskById(userId, taskId);

    if (
      updateData.status &&
      !Object.values(TaskStatus).includes(updateData.status)
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Status must be one of: ${Object.values(TaskStatus).join(", ")}`
      );
    }

    let dueDateObj;
    if (updateData.dueDate !== undefined) {
      if (updateData.dueDate === null) {
        dueDateObj = null;
      } else {
        try {
          dueDateObj = new Date(updateData.dueDate);
        } catch (error) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format");
        }
      }
    }

    if (updateData.isFocus) {
      await db
        .update(tasks)
        .set({ isFocus: false } as Task)
        .where(
          and(
            eq(tasks.userId, userId),
            eq(tasks.isFocus, true),
            ne(tasks.id, taskId)
          )
        );
    }

    const data: Partial<Task> = {};

    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.description !== undefined)
      data.description = updateData.description;
    if (updateData.category !== undefined) data.category = updateData.category;
    if (updateData.isFocus !== undefined) data.isFocus = updateData.isFocus;
    if (updateData.status !== undefined) data.status = updateData.status;
    if (updateData.dueDate !== undefined) data.dueDate = dueDateObj;

    const result = await db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return result[0];
  },

  /**
   * Delete a task
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    const existingTask = await this.getTaskById(userId, taskId);

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  },
};
