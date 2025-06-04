import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "@/utils/catch-async";
import * as calendarService from "./calendar.service";
import { IUser } from "@/types/interfaces/resources";

export const calendarController = {
  authorize: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const url = await calendarService.generateAuthUrl(user.id);
    res.status(httpStatus.OK).json({ url });
  }),

  callback: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { code } = req.query as { code: string };
    await calendarService.storeToken(user.id, code);
    res.status(httpStatus.OK).json({ success: true });
  }),

  getNextEvent: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const event = await calendarService.getNextEvent(user.id);
    res.status(httpStatus.OK).json(event);
  }),

  revoke: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    await calendarService.revokeToken(user.id);
    res.status(httpStatus.NO_CONTENT).send();
  }),
};
