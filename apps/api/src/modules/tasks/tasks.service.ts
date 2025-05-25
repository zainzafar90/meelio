import { db } from "@/db";
import { Task, TaskInsert, tasks } from "@/db/schema";
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
  async createTask(userId: string, taskData: any): Promise<Task> {
    if (!taskData.title) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Title is required");
    }

    let dueDateObj;
    if (taskData.dueDate) {
      try {
        dueDateObj = new Date(taskData.dueDate);
      } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format");
      }
    }

    const insertData = {
      userId,
      title: taskData.title,
      completed: taskData.completed ?? false,
      category: taskData.category ?? null,
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

    const data: Partial<Task> = {};

    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.completed !== undefined)
      data.completed = updateData.completed;
    if (updateData.category !== undefined) data.category = updateData.category;
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

  /**
   * Delete all tasks for a user in a category
   */
  async deleteTasksByCategory(userId: string, category: string): Promise<void> {
    await db
      .delete(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.category, category)));
  },
};
