import { Request, Response } from "express";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors";
import { config } from "@/config/config";
import {
  OAuthConfig,
  buildConsentUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
} from "./google-calendar.service";
import { TokenStore } from "./token-store";
import { StateStore } from "./state-store";
import { IUser } from "@/types/interfaces/resources";
import { catchAsync } from "@/utils/catch-async";

export interface CalendarDependencies {
  tokenStore: TokenStore;
  stateStore: StateStore;
  fetcher: typeof fetch;
  now: () => number;
}

export interface CalendarController {
  startOAuth: (req: Request, res: Response, next: any) => void;
  handleCallback: (req: Request, res: Response, next: any) => void;
  getToken: (req: Request, res: Response, next: any) => void;
}

const oauthCfg: OAuthConfig = {
  clientId: config.google.clientId,
  clientSecret: config.google.clientSecret,
  redirectUri: `${config.clientUrl}/api/oauth/google/callback`,
};

/**
 * Build controller for calendar OAuth handling.
 */
export const calendarController = ({
  tokenStore,
  stateStore,
  fetcher,
  now,
}: CalendarDependencies): CalendarController => ({
  /** Send Google consent URL. */
  startOAuth: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser | undefined;
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "auth required");
    const state = await stateStore.create(user.id);
    const url = buildConsentUrl(oauthCfg, state);
    res.status(httpStatus.OK).json({ url });
  }),

  /** Handle OAuth callback. */
  handleCallback: catchAsync(async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    if (!code || !state)
      throw new ApiError(httpStatus.BAD_REQUEST, "missing params");
    const userId = await stateStore.consume(state);
    if (!userId) throw new ApiError(httpStatus.BAD_REQUEST, "bad state");
    const tokens = await exchangeCodeForTokens(oauthCfg, code, fetcher, now);
    await tokenStore.set(userId, tokens);
    res.status(httpStatus.OK).json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt,
    });
  }),

  /** Provide valid access token for calendar calls. */
  getToken: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IUser | undefined;
    if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "auth required");
    const entry = await tokenStore.get(user.id);
    if (!entry) throw new ApiError(httpStatus.NOT_FOUND, "no token");
    let { accessToken, refreshToken, expiresAt } = entry;
    if (expiresAt - now() <= 5 * 60 * 1000) {
      const refreshed = await refreshAccessToken(
        oauthCfg,
        refreshToken,
        fetcher,
        now,
      );
      accessToken = refreshed.accessToken;
      expiresAt = refreshed.expiresAt;
      await tokenStore.update(user.id, { accessToken, expiresAt });
    }
    res.status(httpStatus.OK).json({
      access_token: accessToken,
      expires_at: expiresAt,
    });
  }),
});
