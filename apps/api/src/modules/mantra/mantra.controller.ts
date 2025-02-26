import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { mantraService } from "./mantra.service";
import { MantraType } from "@/db/schema";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const mantraController = {
  /**
   * Get mantras for the authenticated user with optional filters
   */
  getMantras: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { type } = req.query;

    const filters = {
      type: type as MantraType,
    };

    const mantras = await mantraService.getMantras(userId, filters);
    return res.status(httpStatus.OK).json(mantras);
  }),

  /**
   * Get a specific mantra by ID
   */
  getMantra: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const mantra = await mantraService.getMantraById(userId, id);
    return res.status(httpStatus.OK).json(mantra);
  }),

  /**
   * Create a new mantra
   */
  createMantra: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const mantraData = req.body;

    const mantra = await mantraService.createMantra(userId, mantraData);
    return res.status(httpStatus.CREATED).json(mantra);
  }),

  /**
   * Update an existing mantra
   */
  updateMantra: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const updateData = req.body;

    const mantra = await mantraService.updateMantra(userId, id, updateData);
    return res.status(httpStatus.OK).json(mantra);
  }),

  /**
   * Delete a mantra
   */
  deleteMantra: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    await mantraService.deleteMantra(userId, id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};
