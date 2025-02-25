import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import * as breathepodService from "./breathepod.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

/**
 * Get breathepod for the authenticated user
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getBreathepod = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const breathepod = await breathepodService.getBreathepod(userId);
    if (!breathepod) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Breathepod not found",
      });
    }

    return res.status(httpStatus.OK).json(breathepod);
  }
);

/**
 * Update breathepod for the authenticated user
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const updateBreathepod = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const breathepod = await breathepodService.createOrUpdateBreathepod(
      userId,
      req.body
    );
    return res.status(httpStatus.OK).json(breathepod);
  }
);
