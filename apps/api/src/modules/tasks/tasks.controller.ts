import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { tasksService } from "./tasks.service";
import { IUser } from "@/types/interfaces/resources";

export const tasksController = {
  /**
   * Get tasks for the authenticated user with optional filters
   */
  getTasks: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { completed, category, dueDate, sortBy, sortOrder } = req.query;

    const filters = {
      completed: completed === "true" ? true : completed === "false" ? false : undefined,
      category: category as string,
      dueDate: dueDate as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    };

    const tasks = await tasksService.getTasks(user.id, filters);
    return res.status(httpStatus.OK).json(tasks);
  }),

  /**
   * Get a specific task by ID
   */
  getTask: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;

    const task = await tasksService.getTaskById(user.id, id);
    return res.status(httpStatus.OK).json(task);
  }),

  /**
   * Get task categories
   */
  getCategories: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const categories = await tasksService.getCategories(user.id);
    return res.status(httpStatus.OK).json(categories);
  }),

  /**
   * Create a new task
   */
  createTask: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const taskData = req.body;

    const task = await tasksService.createTask(user.id, taskData);
    return res.status(httpStatus.CREATED).json(task);
  }),

  /**
   * Update an existing task
   */
  updateTask: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const updateData = req.body;

    const task = await tasksService.updateTask(user.id, id, updateData);
    return res.status(httpStatus.OK).json(task);
  }),

  /**
   * Delete a task
   */
  deleteTask: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;

    await tasksService.deleteTask(user.id, id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),

  /**
   * Delete all tasks in a category
   */
  deleteTasksByCategory: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { category } = req.params;

    await tasksService.deleteTasksByCategory(user.id, category);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};