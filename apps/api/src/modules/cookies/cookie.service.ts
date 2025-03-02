import { Response, Request } from "express";

import { config } from "@/config/config";
import { IAccessAndRefreshTokens } from "@/types/interfaces/resources";
import { COOKIE_API_TOKEN } from "../auth/providers/passport";

export const cookieService = {
  setResponseCookie: async (
    res: Response,
    tokens: IAccessAndRefreshTokens
  ): Promise<void> => {
    const cookieOptions = {
      secure: config.env === "production",
      sameSite: "lax" as const,
      expires: tokens.access.expires,
      httpOnly: true,
      path: "/",
    };

    res.cookie(COOKIE_API_TOKEN, tokens.access.token, cookieOptions);
  },

  clearJwtCookie: (response: Response) => {
    const cookieOptions = {
      secure: config.env === "production",
      sameSite: "lax" as const,
      httpOnly: true,
      path: "/",
    };

    response.clearCookie(COOKIE_API_TOKEN, cookieOptions);
  },

  getAuthCookieToken: (request: Request) => {
    const apiToken = request.cookies[COOKIE_API_TOKEN];
    return apiToken;
  },
};
