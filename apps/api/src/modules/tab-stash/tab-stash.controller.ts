import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { tabStashService } from "./tab-stash.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const tabStashController = {
  /**
   * Get tab stashes for the authenticated user
   */
  getTabStashes: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const tabStashes = await tabStashService.getTabStashes(userId);
      return res.status(httpStatus.OK).json(tabStashes);
    }
  ),

  /**
   * Get a tab stash by ID
   */
  getTabStash: catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const tabStash = await tabStashService.getTabStashById(id, userId);
    return res.status(httpStatus.OK).json(tabStash);
  }),

  /**
   * Create a tab stash
   */
  createTabStash: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const tabStash = await tabStashService.createTabStash(userId, req.body);
      return res.status(httpStatus.CREATED).json(tabStash);
    }
  ),

  /**
   * Update a tab stash
   */
  updateTabStash: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;
      const tabStash = await tabStashService.updateTabStash(
        id,
        userId,
        req.body
      );
      return res.status(httpStatus.OK).json(tabStash);
    }
  ),

  /**
   * Delete a tab stash
   */
  deleteTabStash: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;
      await tabStashService.deleteTabStash(id, userId);
      return res.status(httpStatus.NO_CONTENT).send();
    }
  ),
};
