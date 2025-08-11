import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { tabStashService } from "./tab-stash.service";
import { IUser } from "@/types/interfaces/resources";

export const tabStashController = {
  /**
   * Get all tab stashes for the authenticated user (for full sync)
   */
  getTabStashes: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const tabStashes = await tabStashService.getTabStashes(user.id);
    return res.status(httpStatus.OK).json(tabStashes);
  }),

  /**
   * Bulk sync operation - handles creates, updates, and deletes
   */
  bulkSync: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { creates = [], updates = [], deletes = [] } = req.body || {};
    const result = await tabStashService.bulkSync(user.id, { creates, updates, deletes });
    return res.status(httpStatus.OK).json(result);
  }),
};
