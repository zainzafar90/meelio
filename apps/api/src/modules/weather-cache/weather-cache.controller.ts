import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import * as weatherCacheService from "./weather-cache.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

/**
 * Get weather cache for the authenticated user
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getWeatherCache = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const cache = await weatherCacheService.getWeatherCache(userId);
    if (!cache) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Weather cache not found",
      });
    }

    return res.status(httpStatus.OK).json(cache);
  }
);

/**
 * Update weather cache for the authenticated user
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const updateWeatherCache = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const cache = await weatherCacheService.createOrUpdateWeatherCache(
      userId,
      req.body
    );
    return res.status(httpStatus.OK).json(cache);
  }
);
