import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { mantraService } from "./mantra.service";
import { MantraType } from "@/db/schema";
import { IUser } from "@/types/interfaces/resources";

export const mantraController = {
  /**
   * Get mantras for the authenticated user with optional filters
   */
  getMantras: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { type } = req.query;

    const filters = {
      type: type as MantraType,
    };

    const mantras = await mantraService.getMantras(user.id, filters);
    return res.status(httpStatus.OK).json(mantras);
  }),

  /**
   * Get a specific mantra by ID
   */
  getMantra: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;

    const mantra = await mantraService.getMantraById(user.id, id);
    return res.status(httpStatus.OK).json(mantra);
  }),

  /**
   * Create a new mantra
   */
  createMantra: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const mantraData = req.body;

    const mantra = await mantraService.createMantra(user.id, mantraData);
    return res.status(httpStatus.CREATED).json(mantra);
  }),

  /**
   * Update an existing mantra
   */
  updateMantra: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const updateData = req.body;

    const mantra = await mantraService.updateMantra(user.id, id, updateData);
    return res.status(httpStatus.OK).json(mantra);
  }),

  /**
   * Delete a mantra
   */
  deleteMantra: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;

    await mantraService.deleteMantra(user.id, id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};
