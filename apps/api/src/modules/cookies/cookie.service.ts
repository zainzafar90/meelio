import { Response, Request } from "express";

import { config } from "@/config/config";
import { IAccessAndRefreshTokens } from "@/types/interfaces/resources";
import { COOKIE_API_TOKEN } from "../auth/providers/passport";

export const COOKIE_REFRESH_TOKEN = "refresh-token";

export const cookieService = {
  setResponseCookie: async (
    res: Response,
    tokens: IAccessAndRefreshTokens
  ): Promise<void> => {
    const accessCookieOptions = {
      secure: config.jwt.cookieOptions.secure,
      sameSite: "lax" as const,
      expires: tokens.access.expires,
      httpOnly: config.jwt.cookieOptions.httpOnly,
      path: "/",
    };

    const refreshCookieOptions = {
      secure: config.jwt.cookieOptions.secure,
      sameSite: "lax" as const,
      expires: tokens.refresh.expires,
      httpOnly: config.jwt.cookieOptions.httpOnly,
      path: "/v1/account",
    };

    res.cookie(COOKIE_API_TOKEN, tokens.access.token, accessCookieOptions);
    res.cookie(COOKIE_REFRESH_TOKEN, tokens.refresh.token, refreshCookieOptions);
  },

  clearJwtCookie: (response: Response) => {
    const baseCookieOptions = {
      secure: config.jwt.cookieOptions.secure,
      sameSite: "lax" as const,
      httpOnly: config.jwt.cookieOptions.httpOnly,
    };

    response.clearCookie(COOKIE_API_TOKEN, {
      ...baseCookieOptions,
      path: "/",
    });

    response.clearCookie(COOKIE_REFRESH_TOKEN, {
      ...baseCookieOptions,
      path: "/v1/account",
    });
  },

  getAuthCookieToken: (request: Request) => {
    const apiToken = request.cookies[COOKIE_API_TOKEN];
    return apiToken;
  },

  getRefreshCookieToken: (request: Request) => {
    const refreshToken = request.cookies[COOKIE_REFRESH_TOKEN];
    return refreshToken;
  },
};
