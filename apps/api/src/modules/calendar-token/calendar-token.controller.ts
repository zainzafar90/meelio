import { Request, Response } from "express";
import httpStatus from "http-status";

import { db } from "@/db";
import { IUser } from "@/types/interfaces/resources";
import { catchAsync } from "@/utils/catch-async";

import { buildCalendarTokenService } from "./calendar-token.service";

const service = buildCalendarTokenService(db);

export const calendarTokenController = {
  /**
   * Save or update a calendar token for the authenticated user
   */
  saveToken: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { token } = req.body as { token: string };
    const saved = await service.saveToken(user.id, token);
    res.status(httpStatus.OK).json(saved);
  }),

  /**
   * Delete the user's calendar token
   */
  deleteToken: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    await service.deleteToken(user.id);
    res.status(httpStatus.NO_CONTENT).send();
  }),
};
