import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";

export const backgroundController = {
  /**
   * Get all backgrounds for the authenticated user
   */
  getBackgrounds: catchAsync(async (req: Request, res: Response) => {
    return res.status(httpStatus.OK).json({
      success: true,
    });
  }),

  /**
   * Set a background as selected for the authenticated user
   */
  setFavouriteBackground: catchAsync(async (req: Request, res: Response) => {
    const { backgroundId } = req.body;
    if (!backgroundId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Background ID is required",
      });
    }

    return res.status(httpStatus.OK).json({
      success: true,
    });
  }),
};
