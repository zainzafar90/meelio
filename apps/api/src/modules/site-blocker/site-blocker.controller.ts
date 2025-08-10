import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { siteBlockerService } from "./site-blocker.service";
import { siteBlockerMapper } from "./site-blocker.mapper";
import { IUser } from "@/types/interfaces/resources";

export const siteBlockerController = {
  /**
   * Get site blockers for the authenticated user
   */
  getSiteBlockers: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;

    // TODO: Remove this once we remove checkPro from site-blocker from extension
    if (!user) {
      return res.status(httpStatus.OK).json([]);
    }

    const { category } = req.query;
    const siteBlockers = await siteBlockerService.getSiteBlockers(
      user.id,
      category as string | undefined,
    );
    return res
      .status(httpStatus.OK)
      .json(siteBlockerMapper.toDtoArray(siteBlockers));
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
    return res.status(httpStatus.OK).json(siteBlockerMapper.toDto(siteBlocker));
  }),

  /**
   * Create or toggle a site blocker
   */
  createSiteBlocker: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const result = await siteBlockerService.createSiteBlocker(
      user.id,
      req.body
    );
    
    if (result === null) {
      // Site was removed
      return res.status(httpStatus.OK).json({ removed: true });
    } else {
      // Site was added
      return res.status(httpStatus.CREATED).json(siteBlockerMapper.toDto(result));
    }
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
    return res.status(httpStatus.OK).json(siteBlockerMapper.toDto(siteBlocker));
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

  bulkSync: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { creates = [], updates = [], deletes = [] } = req.body || {};
    const result = await siteBlockerService.bulkSync(user.id, { creates, updates, deletes });
    return res.status(httpStatus.OK).json({
      created: result.created.map(siteBlockerMapper.toDto),
      updated: result.updated.map(siteBlockerMapper.toDto),
      deleted: result.deleted,
    });
  }),
};
