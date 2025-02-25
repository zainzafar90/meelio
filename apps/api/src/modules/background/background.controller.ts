import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { backgroundService } from "./background.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

/**
 * Get all backgrounds for the authenticated user
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getBackgrounds = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    console.log("userId", userId);
    const backgrounds = await backgroundService.getBackgrounds(userId);
    return res.status(httpStatus.OK).json(backgrounds);
  }
);

/**
 * Get a background by ID
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getBackgroundById = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const background = await backgroundService.getBackgroundById(id);
    console.log("userId", userId);

    if (!background) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Background not found",
      });
    }

    return res.status(httpStatus.OK).json(background);
  }
);

/**
 * Create a new background
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const createBackground = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const background = await backgroundService.createBackground(
      userId,
      req.body
    );
    return res.status(httpStatus.CREATED).json(background);
  }
);

/**
 * Update a background
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const updateBackground = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const background = await backgroundService.updateBackground(id, req.body);
    return res.status(httpStatus.OK).json(background);
  }
);

/**
 * Delete a background
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const deleteBackground = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    await backgroundService.deleteBackground(id);
    return res.status(httpStatus.NO_CONTENT).send();
  }
);
