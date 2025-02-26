import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { syncService } from "./sync.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export const syncController = {
  bulkSync: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

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
      const userId = req.user?.email;
      if (!userId) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          message: "Unauthorized",
        });
      }

      const result = await syncService.getSyncStatus(userId);
      return res.status(httpStatus.OK).json(result);
    }
  ),
};
