import { Request, Response } from "express";
import { generateAuthUrl, storeToken } from "@/lib/google-calendar";
import { logger } from "@/common/logger";
import { config } from "@/config/config";

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
    
    const authUrl = await generateAuthUrl(state);
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
    
    await storeToken(userId, code);
    
    res.redirect(`${config.clientUrl}?calendar=connected`);
  } catch (error) {
    logger.error("Calendar callback error:", error);
    res.redirect(`${config.clientUrl}?calendar=error&error=callback_failed`);
  }
};

export const calendarController = {
  authorize,
  callback,
};