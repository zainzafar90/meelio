import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { pomodoroService } from "./pomodoro.service";

interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export const pomodoroController = {
  /**
   * Get pomodoro settings for the authenticated user
   * @param {AuthenticatedRequest} req - The request object
   * @param {Response} res - The response object
   * @returns {Promise<void>}
   */
  getPomodoroSettings: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          message: "Unauthorized",
        });
      }

      const settings = await pomodoroService.getPomodoroSettings(userId);
      return res.status(httpStatus.OK).json(settings);
    }
  ),

  /**
   * Create or update pomodoro settings for the authenticated user
   * @param {AuthenticatedRequest} req - The request object
   * @param {Response} res - The response object
   * @returns {Promise<void>}
   */
  updatePomodoroSettings: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.email;
      if (!userId) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          message: "Unauthorized",
        });
      }

      const settings = await pomodoroService.createOrUpdatePomodoroSettings(
        userId,
        req.body
      );
      return res.status(httpStatus.OK).json(settings);
    }
  ),
};
