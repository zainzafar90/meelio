import { Response, Request } from 'express';

import config from '../../config/config';
import { AccountTokens } from '../account/account.interfaces';

export const COOKIE_API_TOKEN = 'api-token';

/**
 * Setting Cookie with token, domain & expiration
 * @param {Response} res
 * @param {AccountTokens} tokens
 * @returns {Promise<void>}
 */
export const setResponseCookie = async (res: Response, tokens: AccountTokens): Promise<void> => {
  res.cookie(COOKIE_API_TOKEN, tokens.access.token, {
    secure: true,
    sameSite: 'none',
    expires: tokens.access.expires,
    httpOnly: config.env === 'production',
    domain: config.env === 'production' ? 'meelio.io' : undefined,
  });
};

/**
 * Clear JWT Cookie (logout)
 * @param {Response} response
 * @returns {Promise<void>}
 */
export const clearJwtCookie = (response: Response) => {
  response.clearCookie(COOKIE_API_TOKEN, {
    secure: true,
    sameSite: 'none',
    httpOnly: config.env === 'production',
    domain: config.env === 'production' ? 'meelio.io' : undefined,
  });
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
