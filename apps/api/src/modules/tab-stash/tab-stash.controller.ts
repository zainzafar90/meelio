import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import * as tabStashService from "./tab-stash.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

/**
 * Get tab stashes for the authenticated user
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getTabStashes = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const tabStashes = await tabStashService.getTabStashes(userId);
    return res.status(httpStatus.OK).json(tabStashes);
  }
);

/**
 * Get a tab stash by ID
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getTabStash = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const tabStash = await tabStashService.getTabStashById(id, userId);
    return res.status(httpStatus.OK).json(tabStash);
  }
);

/**
 * Create a tab stash
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const createTabStash = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const tabStash = await tabStashService.createTabStash(userId, req.body);
    return res.status(httpStatus.CREATED).json(tabStash);
  }
);

/**
 * Update a tab stash
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const updateTabStash = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const tabStash = await tabStashService.updateTabStash(id, userId, req.body);
    return res.status(httpStatus.OK).json(tabStash);
  }
);

/**
 * Delete a tab stash
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const deleteTabStash = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    await tabStashService.deleteTabStash(id, userId);
    return res.status(httpStatus.NO_CONTENT).send();
  }
);
