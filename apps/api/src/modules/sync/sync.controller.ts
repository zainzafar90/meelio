import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { syncService } from "./sync.service";
import { IUser } from "@/types/interfaces/resources";

export const syncController = {
  bulkSync: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const syncRequest = {
      userId: user.id,
      operations: req.body.operations,
      lastSyncTimestamp: req.body.lastSyncTimestamp
        ? new Date(req.body.lastSyncTimestamp)
        : undefined,
    };

    const result = await syncService.processSync(syncRequest);
    return res.status(httpStatus.OK).json(result);
  }),

  getSyncStatus: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const result = await syncService.getSyncStatus(user.id);
    return res.status(httpStatus.OK).json(result);
  }),

  /**
   * Get bulk feed data similar to Momentum Dash
   */
  getBulkFeed: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const { syncTypes, localDate } = req.query;

    const options = {
      syncTypes: syncTypes as string,
      localDate: localDate as string,
    };

    const result = await syncService.getBulkFeed(user.id, options);
    return res.status(httpStatus.OK).json(result);
  }),
};
