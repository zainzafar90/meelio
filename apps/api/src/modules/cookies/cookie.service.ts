import { Response, Request } from "express";

import { config } from "@/config/config";
import { IAccessAndRefreshTokens } from "@/types/interfaces/resources";
import { COOKIE_API_TOKEN } from "../auth/providers/passport";

/**
 * Setting Cookie with token, domain & expiration
 * @param {Response} res
 * @param {AccountTokens} tokens
 * @returns {Promise<void>}
 */
export const setResponseCookie = async (
  res: Response,
  tokens: IAccessAndRefreshTokens
): Promise<void> => {
  const cookieOptions = {
    secure: config.env === "production",
    sameSite: "lax",
    expires: tokens.access.expires,
    httpOnly: true,
    path: "/",
  };

  res.cookie(COOKIE_API_TOKEN, tokens.access.token, cookieOptions);
};

/**
 * Clear JWT Cookie (logout)
 * @param {Response} response
 * @returns {Promise<void>}
 */
export const clearJwtCookie = (response: Response) => {
  const cookieOptions = {
    secure: config.env === "production",
    sameSite: "lax" as const,
    httpOnly: true,
    path: "/",
  };

  response.clearCookie(COOKIE_API_TOKEN, cookieOptions);
};

/**
 * Get Authentication cookie
 * @param {Response} response
 * @returns {string}
 */
export const getAuthCookieToken = (request: Request) => {
  const apiToken = request.cookies[COOKIE_API_TOKEN];
  return apiToken;
};
