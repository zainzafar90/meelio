import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import * as siteBlockerService from "./site-blocker.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

/**
 * Get site blockers for the authenticated user
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getSiteBlockers = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { category } = req.query;
    const siteBlockers = await siteBlockerService.getSiteBlockers(
      userId,
      category as string | undefined
    );
    return res.status(httpStatus.OK).json(siteBlockers);
  }
);

/**
 * Get a site blocker by ID
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const getSiteBlocker = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const siteBlocker = await siteBlockerService.getSiteBlockerById(id, userId);
    return res.status(httpStatus.OK).json(siteBlocker);
  }
);

/**
 * Create a site blocker
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const createSiteBlocker = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const siteBlocker = await siteBlockerService.createSiteBlocker(
      userId,
      req.body
    );
    return res.status(httpStatus.CREATED).json(siteBlocker);
  }
);

/**
 * Update a site blocker
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const updateSiteBlocker = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const siteBlocker = await siteBlockerService.updateSiteBlocker(
      id,
      userId,
      req.body
    );
    return res.status(httpStatus.OK).json(siteBlocker);
  }
);

/**
 * Delete a site blocker
 * @param {AuthenticatedRequest} req - The request object
 * @param {Response} res - The response object
 * @returns {Promise<void>}
 */
export const deleteSiteBlocker = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.email;
    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    await siteBlockerService.deleteSiteBlocker(id, userId);
    return res.status(httpStatus.NO_CONTENT).send();
  }
);
