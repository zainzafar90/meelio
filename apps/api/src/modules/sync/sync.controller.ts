import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { syncService, BulkFeedOptions } from "./sync.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const syncController = {
  bulkSync: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    const syncRequest = {
      userId,
      operations: req.body.operations,
      lastSyncTimestamp: req.body.lastSyncTimestamp
        ? new Date(req.body.lastSyncTimestamp)
        : undefined,
    };

    const result = await syncService.processSync(syncRequest);
    return res.status(httpStatus.OK).json(result);
  }),

  getSyncStatus: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const result = await syncService.getSyncStatus(userId);
      return res.status(httpStatus.OK).json(result);
    }
  ),

  /**
   * Get bulk feed data similar to Momentum Dash
   */
  getBulkFeed: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    const { syncTypes, localDate } = req.query;

    const options = {
      syncTypes: syncTypes as string,
      localDate: localDate as string,
    };

    const result = await syncService.getBulkFeed(userId, options);
    return res.status(httpStatus.OK).json(result);
  }),
};
