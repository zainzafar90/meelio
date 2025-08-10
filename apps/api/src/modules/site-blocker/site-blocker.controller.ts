import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { siteBlockerService } from "./site-blocker.service";
import { IUser } from "@/types/interfaces/resources";

export const siteBlockerController = {
  /**
   * Get all site blockers for the authenticated user (for full sync)
   */
  getSiteBlockers: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const siteBlockers = await siteBlockerService.getSiteBlockers(user.id);
    return res.status(httpStatus.OK).json(siteBlockers);
  }),

  /**
   * Bulk sync operation - handles creates, updates, and deletes
   */
  bulkSync: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { creates = [], updates = [], deletes = [] } = req.body || {};
    const result = await siteBlockerService.bulkSync(user.id, { creates, updates, deletes });
    return res.status(httpStatus.OK).json(result);
  }),
};
