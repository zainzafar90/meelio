import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { backgroundService } from "./background.service";
import { IUser } from "@/types/interfaces/resources";

export const backgroundController = {
  /**
   * Get all backgrounds for the authenticated user
   */
  getBackgrounds: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const backgrounds = await backgroundService.getBackgrounds(user.id);
    return res.status(httpStatus.OK).json(backgrounds);
  }),

  /**
   * Set a background as selected for the authenticated user
   */
  setFavouriteBackground: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const { backgroundId } = req.body;
    if (!backgroundId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Background ID is required",
      });
    }

    const selectedBackground = await backgroundService.setFavouriteBackground(
      user.id,
      backgroundId
    );

    const backgrounds = await backgroundService.getBackgrounds(user.id);

    return res.status(httpStatus.OK).json({
      backgrounds,
      selectedBackground,
    });
  }),
};
