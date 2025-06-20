import { Request, Response } from "express";
import httpStatus from "http-status";
import { logger } from "@/common/logger";
import { config } from "@/config/config";
import { IUser } from "@/types/interfaces/resources";
import { catchAsync } from "@/utils/catch-async";
import { calendarService } from "./calendar.service";

interface AuthorizeRequest extends Request {
  user?: { id: string };
}

/**
 * Generate Google OAuth URL and redirect user
 */
const authorize = async (req: AuthorizeRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const state = Buffer.from(
      JSON.stringify({ userId, timestamp: Date.now() })
    ).toString("base64");

    const authUrl = await calendarService.generateAuthUrl(state);
    res.json({ authUrl });
  } catch (error) {
    logger.error("Calendar authorization error:", error);
    res.status(500).json({ message: "Authorization failed" });
  }
};

/**
 * Handle OAuth callback from Google
 */
const callback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code || !state) {
      return res.redirect(
        `${config.clientUrl}?calendar=error&error=missing_params`
      );
    }

    const { userId } = JSON.parse(Buffer.from(state, "base64").toString());

    await calendarService.storeToken(userId, code);

    res.redirect(`${config.clientUrl}?calendar=connected`);
  } catch (error) {
    logger.error("Calendar callback error:", error);
    res.redirect(`${config.clientUrl}?calendar=error&error=callback_failed`);
  }
};

/**
 * Get calendar token status for the authenticated user
 */
const getToken = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  const token = await calendarService.getToken(user.id);

  if (!token) {
    return res.status(httpStatus.OK).json({
      accessToken: null,
      expiresAt: null,
    });
  }

  // Check if token is expired and refresh if needed
  const validToken = await calendarService.getValidToken(user.id);

  res.status(httpStatus.OK).json({
    accessToken: validToken?.accessToken,
    expiresAt: validToken?.expiresAt,
  });
});

/**
 * Save or update a calendar token for the authenticated user
 */
const saveToken = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  const { accessToken, refreshToken, expiresAt } = req.body as {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  const saved = await calendarService.saveToken(
    user.id,
    accessToken,
    refreshToken,
    expiresAt
  );
  res.status(httpStatus.OK).json(saved);
});

/**
 * Delete the user's calendar token
 */
const deleteToken = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser;
  await calendarService.deleteToken(user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

export const calendarController = {
  authorize,
  callback,
  getToken,
  saveToken,
  deleteToken,
};
