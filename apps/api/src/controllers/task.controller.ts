import { Request, Response } from "express";
import { db } from "@/db";
import { tasks, TaskStatus } from "@/db/schema";
import {
  eq,
  and,
  desc,
  asc,
  isNull,
  isNotNull,
  or,
  SQL,
  ne,
} from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export class TaskController {
  async getTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get query parameters for filtering
      const { status, category, isFocus, dueDate, sortBy, sortOrder } =
        req.query;

      // Build the query conditions
      const conditions = [eq(tasks.userId, userId)];

      // Add status filter if provided
      if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
        conditions.push(eq(tasks.status, status as TaskStatus));
      }

      // Add category filter if provided
      if (category) {
        conditions.push(eq(tasks.category, category as string));
      }

      // Add focus filter if provided
      if (isFocus !== undefined) {
        const isFocusValue = isFocus === "true";
        conditions.push(eq(tasks.isFocus, isFocusValue));
      }

      // Add due date filter if provided
      if (dueDate) {
        if (dueDate === "null") {
          conditions.push(isNull(tasks.dueDate));
        } else if (dueDate === "not-null") {
          conditions.push(isNotNull(tasks.dueDate));
        } else {
          try {
            const dateObj = new Date(dueDate as string);
            conditions.push(eq(tasks.dueDate, dateObj));
          } catch (error) {
            return res.status(400).json({ message: "Invalid date format" });
          }
        }
      }

      // Build the query with conditions
      let result;

      // Handle sorting
      if (sortBy) {
        const orderFn = sortOrder === "desc" ? desc : asc;
        let orderColumn;

        switch (sortBy) {
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

        result = await db
          .select()
          .from(tasks)
          .where(and(...conditions))
          .orderBy(orderFn(orderColumn));
      } else {
        // Default sorting by created date (newest first)
        result = await db
          .select()
          .from(tasks)
          .where(and(...conditions))
          .orderBy(desc(tasks.createdAt));
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getTask(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const result = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

      if (result.length === 0) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error fetching task:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getFocusTask(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await db
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

      if (result.length === 0) {
        return res.status(404).json({ message: "No focus task found" });
      }

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error fetching focus task:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async createTask(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { title, description, category, isFocus, status, dueDate } =
        req.body;
      if (!title) {
        return res.status(400).json({
          message: "Title is required",
        });
      }

      // Validate status if provided
      if (status && !Object.values(TaskStatus).includes(status)) {
        return res.status(400).json({
          message: `Status must be one of: ${Object.values(TaskStatus).join(", ")}`,
        });
      }

      // Parse due date if provided
      let dueDateObj;
      if (dueDate) {
        try {
          dueDateObj = new Date(dueDate);
        } catch (error) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }

      // If this is a focus task, unset any existing focus tasks
      if (isFocus) {
        await db
          .update(tasks)
          .set({ isFocus: false } as any)
          .where(and(eq(tasks.userId, userId), eq(tasks.isFocus, true)));
      }

      // Insert task
      const insertData = {
        userId,
        title,
        description: description || null,
        category: category || null,
        isFocus: isFocus || false,
        status: (status as TaskStatus) || TaskStatus.PENDING,
        dueDate: dueDateObj || null,
      };

      const result = await db.insert(tasks).values(insertData).returning();

      return res.status(201).json(result[0]);
    } catch (error) {
      console.error("Error creating task:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateTask(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      const { title, description, category, isFocus, status, dueDate } =
        req.body;
      if (
        !title &&
        description === undefined &&
        category === undefined &&
        isFocus === undefined &&
        status === undefined &&
        dueDate === undefined
      ) {
        return res.status(400).json({
          message: "At least one field to update is required",
        });
      }

      // Validate status if provided
      if (status && !Object.values(TaskStatus).includes(status)) {
        return res.status(400).json({
          message: `Status must be one of: ${Object.values(TaskStatus).join(", ")}`,
        });
      }

      // Check if task exists and belongs to user
      const existingTask = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

      if (existingTask.length === 0) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Parse due date if provided
      let dueDateObj;
      if (dueDate !== undefined) {
        if (dueDate === null) {
          dueDateObj = null;
        } else {
          try {
            dueDateObj = new Date(dueDate);
          } catch (error) {
            return res.status(400).json({ message: "Invalid date format" });
          }
        }
      }

      // If this is being set as a focus task, unset any existing focus tasks
      if (isFocus) {
        await db
          .update(tasks)
          .set({ isFocus: false } as any)
          .where(
            and(
              eq(tasks.userId, userId),
              eq(tasks.isFocus, true),
              ne(tasks.id, id) // Not the current task
            )
          );
      }

      // Update task
      const updateData: Record<string, unknown> = {};

      if (title !== undefined) {
        updateData.title = title;
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (category !== undefined) {
        updateData.category = category;
      }

      if (isFocus !== undefined) {
        updateData.isFocus = isFocus;
      }

      if (status !== undefined) {
        updateData.status = status as TaskStatus;
      }

      if (dueDate !== undefined) {
        updateData.dueDate = dueDateObj;
      }

      const result = await db
        .update(tasks)
        .set(updateData as any)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .returning();

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error updating task:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteTask(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Task ID is required" });
      }

      // Check if task exists and belongs to user
      const existingTask = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

      if (existingTask.length === 0) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Delete task
      await db
        .delete(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
