import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { soundscapesService } from "./soundscapes.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const soundscapesController = {
  /**
   * Get soundscapes for the authenticated user with optional filters
   */
  getSoundscapes: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { shareable } = req.query;

      const filters = {
        shareable: shareable === "true",
      };

      const soundscapes = await soundscapesService.getSoundscapes(
        userId,
        filters
      );
      return res.status(httpStatus.OK).json(soundscapes);
    }
  ),

  /**
   * Get a specific soundscape by ID
   */
  getSoundscape: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;

      const soundscape = await soundscapesService.getSoundscapeById(userId, id);
      return res.status(httpStatus.OK).json(soundscape);
    }
  ),

  /**
   * Create a new soundscape
   */
  createSoundscape: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const soundscapeData = req.body;

      const soundscape = await soundscapesService.createSoundscape(
        userId,
        soundscapeData
      );
      return res.status(httpStatus.CREATED).json(soundscape);
    }
  ),

  /**
   * Update an existing soundscape
   */
  updateSoundscape: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;
      const updateData = req.body;

      const soundscape = await soundscapesService.updateSoundscape(
        userId,
        id,
        updateData
      );
      return res.status(httpStatus.OK).json(soundscape);
    }
  ),

  /**
   * Delete a soundscape
   */
  deleteSoundscape: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;

      await soundscapesService.deleteSoundscape(userId, id);
      return res.status(httpStatus.NO_CONTENT).send();
    }
  ),
};
