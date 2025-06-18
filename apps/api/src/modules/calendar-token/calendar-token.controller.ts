import { Request, Response } from "express";
import httpStatus from "http-status";

import { db } from "@/db";
import { IUser } from "@/types/interfaces/resources";
import { catchAsync } from "@/utils/catch-async";

import { buildCalendarTokenService } from "./calendar-token.service";

const service = buildCalendarTokenService(db);

export const calendarTokenController = {
  /**
   * Get calendar token status for the authenticated user
   */
  getToken: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const token = await service.getToken(user.id);

    if (!token) {
      return res.status(httpStatus.OK).json({
        hasToken: false,
        accessToken: null,
        expiresAt: null,
      });
    }

    // Check if token is expired and refresh if needed
    const validToken = await service.getValidToken(user.id);

    res.status(httpStatus.OK).json({
      hasToken: true,
      accessToken: validToken?.accessToken,
      expiresAt: validToken?.expiresAt,
    });
  }),

  /**
   * Save or update a calendar token for the authenticated user
   */
  saveToken: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const { accessToken, refreshToken, expiresAt } = req.body as {
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
    };
    const saved = await service.saveToken(
      user.id,
      accessToken,
      refreshToken,
      expiresAt
    );
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
