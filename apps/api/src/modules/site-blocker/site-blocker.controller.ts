import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { siteBlockerService } from "./site-blocker.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const siteBlockerController = {
  /**
   * Get site blockers for the authenticated user
   */
  getSiteBlockers: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { category } = req.query;
      const siteBlockers = await siteBlockerService.getSiteBlockers(
        userId,
        category as string | undefined
      );
      return res.status(httpStatus.OK).json(siteBlockers);
    }
  ),

  /**
   * Get a site blocker by ID
   */
  getSiteBlocker: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;
      const siteBlocker = await siteBlockerService.getSiteBlockerById(
        id,
        userId
      );
      return res.status(httpStatus.OK).json(siteBlocker);
    }
  ),

  /**
   * Create a site blocker
   */
  createSiteBlocker: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const siteBlocker = await siteBlockerService.createSiteBlocker(
        userId,
        req.body
      );
      return res.status(httpStatus.CREATED).json(siteBlocker);
    }
  ),

  /**
   * Update a site blocker
   */
  updateSiteBlocker: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;
      const siteBlocker = await siteBlockerService.updateSiteBlocker(
        id,
        userId,
        req.body
      );
      return res.status(httpStatus.OK).json(siteBlocker);
    }
  ),

  /**
   * Delete a site blocker
   */
  deleteSiteBlocker: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;
      await siteBlockerService.deleteSiteBlocker(id, userId);
      return res.status(httpStatus.NO_CONTENT).send();
    }
  ),
};
