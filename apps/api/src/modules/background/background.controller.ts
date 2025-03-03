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
   * Get a background by ID
   */
  getBackgroundById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const background = await backgroundService.getBackgroundById(id);

    if (!background) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Background not found",
      });
    }

    return res.status(httpStatus.OK).json(background);
  }),

  /**
   * Set a background as selected for the authenticated user
   */
  setSelectedBackground: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const { backgroundId } = req.body;
    if (!backgroundId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Background ID is required",
      });
    }

    const selectedBackground = await backgroundService.setSelectedBackground(
      user.id,
      backgroundId
    );

    const backgrounds = await backgroundService.getBackgrounds(user.id);

    return res.status(httpStatus.OK).json({
      backgrounds,
      selectedBackground,
    });
  }),

  /**
   * Get a random background (for daily rotation)
   */
  getRandomBackground: catchAsync(async (req: Request, res: Response) => {
    const background = await backgroundService.getRandomBackground();
    if (!background) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "No backgrounds available",
      });
    }
    return res.status(httpStatus.OK).json(background);
  }),

  /**
   * Create a new background (globally available)
   */
  createBackground: catchAsync(async (req: Request, res: Response) => {
    // Check for admin permission if needed

    const background = await backgroundService.createBackground(req.body);
    return res.status(httpStatus.CREATED).json(background);
  }),

  /**
   * Update a background
   */
  updateBackground: catchAsync(async (req: Request, res: Response) => {
    // Check for admin permission if needed

    const { id } = req.params;
    const background = await backgroundService.updateBackground(id, req.body);
    return res.status(httpStatus.OK).json(background);
  }),

  /**
   * Delete a background
   */
  deleteBackground: catchAsync(async (req: Request, res: Response) => {
    // Check for admin permission if needed

    const { id } = req.params;
    await backgroundService.deleteBackground(id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};
