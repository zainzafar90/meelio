import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { backgroundService } from "./background.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export const backgroundController = {
  /**
   * Get all backgrounds for the authenticated user
   */
  getBackgrounds: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;

      const backgrounds = await backgroundService.getBackgrounds(userId);
      return res.status(httpStatus.OK).json(backgrounds);
    }
  ),

  /**
   * Get a background by ID
   */
  getBackgroundById: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;

      const { id } = req.params;
      const background = await backgroundService.getBackgroundById(id);

      if (!background) {
        return res.status(httpStatus.NOT_FOUND).json({
          message: "Background not found",
        });
      }

      return res.status(httpStatus.OK).json(background);
    }
  ),

  /**
   * Set a background as selected for the authenticated user
   */
  setSelectedBackground: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;

      const { backgroundId } = req.body;
      if (!backgroundId) {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: "Background ID is required",
        });
      }

      const background = await backgroundService.setSelectedBackground(
        userId,
        backgroundId
      );
      return res.status(httpStatus.OK).json(background);
    }
  ),

  /**
   * Get a random background (for daily rotation)
   */
  getRandomBackground: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;

      const background = await backgroundService.getRandomBackground();
      return res.status(httpStatus.OK).json(background);
    }
  ),

  /**
   * Create a new background
   */
  createBackground: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;

      const background = await backgroundService.createBackground(
        userId,
        req.body
      );
      return res.status(httpStatus.CREATED).json(background);
    }
  ),

  /**
   * Update a background
   */
  updateBackground: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;

      const { id } = req.params;
      const background = await backgroundService.updateBackground(id, req.body);
      return res.status(httpStatus.OK).json(background);
    }
  ),

  /**
   * Delete a background
   */
  deleteBackground: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;

      const { id } = req.params;
      await backgroundService.deleteBackground(id);
      return res.status(httpStatus.NO_CONTENT).send();
    }
  ),
};
