import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { focusSessionService } from "./focus-session.service";
import { IUser } from "@/types/interfaces/resources";

export const focusSessionController = {
  /**
   * Get focus sessions for the authenticated user
   */
  getFocusSessions: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const sessions = await focusSessionService.getFocusSessions(user.id);
    return res.status(httpStatus.OK).json(sessions);
  }),

  /**
   * Get a focus session by ID
   */
  getFocusSession: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const session = await focusSessionService.getFocusSessionById(id, user.id);
    return res.status(httpStatus.OK).json(session);
  }),

  /**
   * Create a focus session
   */
  createFocusSession: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const session = await focusSessionService.createFocusSession(
      user.id,
      req.body
    );
    return res.status(httpStatus.CREATED).json(session);
  }),

  /**
   * Update a focus session
   */
  updateFocusSession: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    const session = await focusSessionService.updateFocusSession(
      id,
      user.id,
      req.body
    );
    return res.status(httpStatus.OK).json(session);
  }),

  /**
   * Delete a focus session
   */
  deleteFocusSession: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { id } = req.params;
    await focusSessionService.deleteFocusSession(id, user.id);
    return res.status(httpStatus.NO_CONTENT).send();
  }),
};
