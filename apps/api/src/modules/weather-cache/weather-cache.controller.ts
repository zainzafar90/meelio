import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { weatherCacheService } from "./weather-cache.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const weatherCacheController = {
  /**
   * Get weather cache for the authenticated user
   */
  getWeatherCache: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const cache = await weatherCacheService.getWeatherCache(userId);

      if (!cache) {
        return res.status(httpStatus.NOT_FOUND).json({
          message: "Weather cache not found",
        });
      }

      return res.status(httpStatus.OK).json(cache);
    }
  ),

  /**
   * Update weather cache for the authenticated user
   */
  updateWeatherCache: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const cache = await weatherCacheService.createOrUpdateWeatherCache(
        userId,
        req.body
      );
      return res.status(httpStatus.OK).json(cache);
    }
  ),
};
