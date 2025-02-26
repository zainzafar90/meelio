import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { focusSessionService } from "./focus-session.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const focusSessionController = {
  /**
   * Get focus sessions for the authenticated user
   */
  getFocusSessions: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const sessions = await focusSessionService.getFocusSessions(userId);
      return res.status(httpStatus.OK).json(sessions);
    }
  ),

  /**
   * Get a focus session by ID
   */
  getFocusSession: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;
      const session = await focusSessionService.getFocusSessionById(id, userId);
      return res.status(httpStatus.OK).json(session);
    }
  ),

  /**
   * Create a focus session
   */
  createFocusSession: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const session = await focusSessionService.createFocusSession(
        userId,
        req.body
      );
      return res.status(httpStatus.CREATED).json(session);
    }
  ),

  /**
   * Update a focus session
   */
  updateFocusSession: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;
      const session = await focusSessionService.updateFocusSession(
        id,
        userId,
        req.body
      );
      return res.status(httpStatus.OK).json(session);
    }
  ),

  /**
   * Delete a focus session
   */
  deleteFocusSession: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const { id } = req.params;
      await focusSessionService.deleteFocusSession(id, userId);
      return res.status(httpStatus.NO_CONTENT).send();
    }
  ),
};
