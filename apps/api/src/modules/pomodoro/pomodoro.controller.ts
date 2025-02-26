import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { pomodoroService } from "./pomodoro.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const pomodoroController = {
  /**
   * Get pomodoro settings for the authenticated user
   */
  getPomodoroSettings: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const settings = await pomodoroService.getPomodoroSettings(userId);
      return res.status(httpStatus.OK).json(settings);
    }
  ),

  /**
   * Create or update pomodoro settings for the authenticated user
   */
  updatePomodoroSettings: catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      const settings = await pomodoroService.createOrUpdatePomodoroSettings(
        userId,
        req.body
      );
      return res.status(httpStatus.OK).json(settings);
    }
  ),
};
