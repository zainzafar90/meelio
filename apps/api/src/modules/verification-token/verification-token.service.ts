import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import httpStatus from 'http-status';
import config from '../../config/config';
import ApiError from '../errors/ApiError';
import { IVerificationTokenDoc } from './verification-token.interfaces';
import { IUserDoc } from '../user/user.interfaces';
import { userService } from '../user';
import { TokenType } from './verification-token.types';
import VerificationToken from './verification-token.model';

/**
 * Generate verification token
 * @param {string} email
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateVerificationToken = (
  userEmail: string,
  expires: Moment,
  type: string,
  secret: string = config.jwt.secret
): string => {
  const payload = {
    sub: userEmail,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {string} email
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<IVerificationTokenDoc>}
 */
const saveVerificationToken = async (
  token: string,
  email: string,
  expires: Moment,
  type: string,
  blacklisted: boolean = false
): Promise<IVerificationTokenDoc> => {
  const tokenDoc = await VerificationToken.create({
    token,
    email,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email: string): Promise<string> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NO_CONTENT, '');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateVerificationToken(user.email, expires, TokenType.RESET_PASSWORD);
  await saveVerificationToken(resetPasswordToken, user.email, expires, TokenType.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {IUserDoc} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user: IUserDoc): Promise<string> => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateVerificationToken(user.email, expires, TokenType.VERIFY_EMAIL);
  await saveVerificationToken(verifyEmailToken, user.email, expires, TokenType.VERIFY_EMAIL);
  return verifyEmailToken;
};

/**
 * Generate magic link token
 * @param {IUserDoc} user
 * @returns {Promise<string>}
 */
const generateMagicLinkToken = async (email: string): Promise<string> => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateVerificationToken(email, expires, TokenType.MAGIC_LINK);
  await saveVerificationToken(verifyEmailToken, email, expires, TokenType.MAGIC_LINK);
  return verifyEmailToken;
};

/**
 * Verify token and return verification token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<IVerificationTokenDoc>}
 */
const verifyVerificationToken = async (token: string, type: string): Promise<IVerificationTokenDoc> => {
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Verification token is missing');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
  }

  if (!payload || !payload.sub || typeof payload.sub !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token payload is malformed or bad user');
  }

  const verificationTokenDoc = await VerificationToken.findOne({
    token,
    type,
    email: payload.sub,
    blacklisted: false,
  });
  if (!verificationTokenDoc) {
    throw new Error('Verification token not found');
  }
  return verificationTokenDoc;
};

export const verificationTokenService = {
  generateResetPasswordToken,
  generateVerifyEmailToken,
  generateMagicLinkToken,
  verifyVerificationToken,
};
