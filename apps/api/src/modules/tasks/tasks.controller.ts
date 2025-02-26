import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { tasksService } from "./tasks.service";
import { TaskStatus } from "@/db/schema";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const tasksController = {
  /**
   * Get tasks for the authenticated user with optional filters
   */
  getTasks: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { status, category, isFocus, dueDate, sortBy, sortOrder } = req.query;

    const filters = {
      status: status as TaskStatus,
      category: category as string,
      isFocus: isFocus === "true",
      dueDate: dueDate as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    };

    const tasks = await tasksService.getTasks(userId, filters);
    return res.status(httpStatus.OK).json(tasks);
  }),

  /**
   * Get a specific task by ID
   */
  getTask: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const task = await tasksService.getTaskById(userId, id);
    return res.status(httpStatus.OK).json(task);
  }),

  /**
   * Get the current focus task
   */
  getFocusTask: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    const task = await tasksService.getFocusTask(userId);
    return res.status(httpStatus.OK).json(task);
  }),

  /**
   * Create a new task
   */
  createTask: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const taskData = req.body;

    const task = await tasksService.createTask(userId, taskData);
    return res.status(httpStatus.CREATED).json(task);
  }),

  /**
   * Update an existing task
   */
  updateTask: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const updateData = req.body;

    const task = await tasksService.updateTask(userId, id, updateData);
    return res.status(httpStatus.OK).json(task);
  }),

  /**
   * Delete a task
   */
  deleteTask: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    await tasksService.deleteTask(userId, id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};
