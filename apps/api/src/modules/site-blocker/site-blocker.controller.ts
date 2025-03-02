import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { siteBlockerService } from "./site-blocker.service";
import { IUser } from "@/types/interfaces/resources";

export const siteBlockerController = {
  /**
   * Get site blockers for the authenticated user
   */
  getSiteBlockers: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { category } = req.query;
    const siteBlockers = await siteBlockerService.getSiteBlockers(
      user.id,
      category as string | undefined
    );
    return res.status(httpStatus.OK).json(siteBlockers);
  }),

  /**
   * Get a site blocker by ID
   */
  getSiteBlocker: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const siteBlocker = await siteBlockerService.getSiteBlockerById(
      id,
      user.id
    );
    return res.status(httpStatus.OK).json(siteBlocker);
  }),

  /**
   * Create a site blocker
   */
  createSiteBlocker: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const siteBlocker = await siteBlockerService.createSiteBlocker(
      user.id,
      req.body
    );
    return res.status(httpStatus.CREATED).json(siteBlocker);
  }),

  /**
   * Update a site blocker
   */
  updateSiteBlocker: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const siteBlocker = await siteBlockerService.updateSiteBlocker(
      id,
      user.id,
      req.body
    );
    return res.status(httpStatus.OK).json(siteBlocker);
  }),

  /**
   * Delete a site blocker
   */
  deleteSiteBlocker: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    await siteBlockerService.deleteSiteBlocker(id, user.id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};
