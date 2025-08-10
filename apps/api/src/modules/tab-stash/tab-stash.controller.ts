import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { tabStashService } from "./tab-stash.service";
import { IUser } from "@/types/interfaces/resources";

export const tabStashController = {
  /**
   * Get tab stashes for the authenticated user
   */
  getTabStashes: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const tabStashes = await tabStashService.getTabStashes(user.id);
    return res.status(httpStatus.OK).json(tabStashes);
  }),

  /**
   * Get a tab stash by ID
   */
  getTabStash: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const tabStash = await tabStashService.getTabStashById(id, user.id);
    return res.status(httpStatus.OK).json(tabStash);
  }),

  /**
   * Create a tab stash
   */
  createTabStash: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const tabStash = await tabStashService.createTabStash(user.id, req.body);
    return res.status(httpStatus.CREATED).json(tabStash);
  }),

  /**
   * Update a tab stash
   */
  updateTabStash: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const tabStash = await tabStashService.updateTabStash(
      id,
      user.id,
      req.body
    );
    return res.status(httpStatus.OK).json(tabStash);
  }),

  /**
   * Delete a tab stash
   */
  deleteTabStash: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    await tabStashService.deleteTabStash(id, user.id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),

  bulkSync: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { creates = [], updates = [], deletes = [] } = req.body || {};
    const result = await tabStashService.bulkSync(user.id, { creates, updates, deletes });
    return res.status(httpStatus.OK).json(result);
  }),
};
