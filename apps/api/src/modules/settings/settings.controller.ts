import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "@/utils";
import { settingsService } from "./settings.service";
import { IUser } from "@/types/interfaces/resources";

export const updateSettings = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const settings = await settingsService.updateSettings(user.id, req.body);
    res.status(httpStatus.OK).send({ settings });
  }
);

export const updatePomodoroSettings = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const settings = await settingsService.updatePomodoroSettings(
      user.id,
      req.body
    );
    res.status(httpStatus.OK).send({ settings });
  }
);

export const updateTaskSettings = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const settings = await settingsService.updateTaskSettings(
      user.id,
      req.body
    );
    res.status(httpStatus.OK).send({ settings });
  }
);
