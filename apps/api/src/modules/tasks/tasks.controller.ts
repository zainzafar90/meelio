import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { tasksService } from "./tasks.service";
import { IUser } from "@/types/interfaces/resources";

export const tasksController = {
  /**
   * Get all tasks for the authenticated user (for full sync)
   */
  getTasks: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const tasks = await tasksService.getTasks(user.id);
    return res.status(httpStatus.OK).json(tasks);
  }),

  /**
   * Bulk sync operation - handles creates, updates, and deletes
   */
  bulkSync: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { creates = [], updates = [], deletes = [] } = req.body || {};
    const result = await tasksService.bulkSync(user.id, { creates, updates, deletes });
    return res.status(httpStatus.OK).json(result);
  }),
};