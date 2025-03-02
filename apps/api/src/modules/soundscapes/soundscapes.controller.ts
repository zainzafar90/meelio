import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { soundscapesService } from "./soundscapes.service";
import { IUser } from "@/types/interfaces/resources";

export const soundscapesController = {
  /**
   * Get soundscapes for the authenticated user with optional filters
   */
  getSoundscapes: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { shareable } = req.query;

    const filters = {
      shareable: shareable === "true",
    };

    const soundscapes = await soundscapesService.getSoundscapes(
      user.id,
      filters
    );
    return res.status(httpStatus.OK).json(soundscapes);
  }),

  /**
   * Get a specific soundscape by ID
   */
  getSoundscape: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;

    const soundscape = await soundscapesService.getSoundscapeById(user.id, id);
    return res.status(httpStatus.OK).json(soundscape);
  }),

  /**
   * Create a new soundscape
   */
  createSoundscape: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const soundscapeData = req.body;

    const soundscape = await soundscapesService.createSoundscape(
      user.id,
      soundscapeData
    );
    return res.status(httpStatus.CREATED).json(soundscape);
  }),

  /**
   * Update an existing soundscape
   */
  updateSoundscape: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const updateData = req.body;

    const soundscape = await soundscapesService.updateSoundscape(
      user.id,
      id,
      updateData
    );
    return res.status(httpStatus.OK).json(soundscape);
  }),

  /**
   * Delete a soundscape
   */
  deleteSoundscape: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;

    await soundscapesService.deleteSoundscape(user.id, id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};
