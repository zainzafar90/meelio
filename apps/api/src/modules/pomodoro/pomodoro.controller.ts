import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils/catch-async";
import { pomodoroService } from "./pomodoro.service";
import { IUser } from "@/types/interfaces/resources";

export const pomodoroController = {
  /**
   * Get pomodoro settings for the authenticated user
   */
  getPomodoroSettings: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const settings = await pomodoroService.getPomodoroSettings(user.id);
    return res.status(httpStatus.OK).json(settings);
  }),

  /**
   * Create or update pomodoro settings for the authenticated user
   */
  updatePomodoroSettings: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const settings = await pomodoroService.createOrUpdatePomodoroSettings(
      user.id,
      req.body
    );
    return res.status(httpStatus.OK).json(settings);
  }),
};
