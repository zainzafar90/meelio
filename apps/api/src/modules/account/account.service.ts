import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { IUser, IUserDoc } from '../user/user.interfaces';
import config from '../../config/config';
import { ApiError } from '../errors';
import Account from './account.model';
import { AccountTokens, IAccountDoc } from './account.interfaces';
import { getUserByEmail, updateUserById } from '../user/user.service';
import { verificationTokenService } from '../verification-token/verification-token.service';
import VerificationToken from '../verification-token/verification-token.model';
import { TokenType } from '../verification-token/verification-token.types';
import User from '../user/user.model';
import { Provider } from './providers/provider.interfaces';
import Subscription from '../subscription/subscription.model';

/**
 * Generate token
 * @param {mongoose.Types.ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (
  userId: mongoose.Types.ObjectId,
  expires: Moment,
  type: string,
  secret: string = config.jwt.secret
): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };

  return jwt.sign(payload, secret);
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<ITokenDoc>}
 */
const verifyToken = async (token: string): Promise<IAccountDoc> => {
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication token is missing');
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

  const accountTokenDoc = await Account.findOne({
    accessToken: token,
    userId: payload.sub,
    blacklisted: false,
  });

  if (!accountTokenDoc) {
    throw new Error('Token not found');
  }
  return accountTokenDoc;
};

/**
 * Generate auth tokens
 * @param {IUserDoc} user
 * @returns {Promise<AccountTokens>}
 */
const generateAuthTokens = async (user: IUserDoc): Promise<AccountTokens> => {
  const accessExpiration = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const refreshExpiration = moment().add(config.jwt.refreshExpirationDays, 'days');

  const accessToken = generateToken(user.id, accessExpiration, TokenType.ACCESS);
  const refreshToken = generateToken(user.id, refreshExpiration, TokenType.REFRESH);

  const tokens = {
    access: {
      token: accessToken,
      expires: accessExpiration.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshExpiration.toDate(),
    },
  };

  return tokens;
};

/**
 * Update account tokens in database
 * @param {string} userId
 * @param {string} provider
 * @param {object} tokens
 */
const updateAccountTokens = async (userId: string, provider: string, tokens: AccountTokens): Promise<void> => {
  await Account.updateOne(
    { userId, provider },
    {
      accessToken: tokens.access.token,
      accessTokenExpires: tokens.access.expires,
      refreshToken: tokens.refresh.token,
      refreshTokenExpires: tokens.refresh.expires,
    },
    {
      upsert: true,
    }
  );
};

/**
 * Check if the user has an active or future subscription.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const checkSubscription = async (
  email: string
): Promise<{
  isPro: boolean;
  subscriptionId: string | null;
}> => {
  const subscription = await Subscription.findOne({ email });
  if (!subscription)
    return {
      isPro: false,
      subscriptionId: null,
    };

  const hasActiveSubscription =
    subscription.status === 'active' ||
    (subscription.status === 'cancelled' && subscription.endsAt && subscription.endsAt > new Date());

  return {
    isPro: !!hasActiveSubscription,
    subscriptionId: subscription.id,
  };
};

/**
 * Get user account
 * @param {string} accessToken
 * @returns {Promise<IUserDoc | null>}
 */
const getUserAccount = async (
  accessToken: string,
  includeId?: boolean
): Promise<{ user: IUser; userId: string; isPro: boolean; subscriptionId: string | null } | null> => {
  const token = await verifyToken(accessToken);
  const user = await User.findById(new mongoose.Types.ObjectId(token.userId));
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { isPro, subscriptionId } = await checkSubscription(user.email);

  return {
    user: user.toJSON(),
    isPro,
    subscriptionId,
    userId: includeId ? user.id : '',
  };
};

/**
 * Update user account
 *
 * @param {string} accessToken
 * @param {IUser} updateBody
 * @returns {Promise<IUserDoc>}
 */
const updateUserAccount = async (
  accessToken: string,
  updateBody: IUser
): Promise<{ user: IUser; isPro: boolean; subscriptionId: string | null } | null> => {
  const token = await verifyToken(accessToken);
  const user = await User.findById(new mongoose.Types.ObjectId(token.userId));
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  Object.assign(user, updateBody);
  await user.save();

  const { isPro, subscriptionId } = await checkSubscription(user.email);

  return {
    user: user.toJSON(),
    isPro,
    subscriptionId,
  };
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<IUserDoc>}
 */
const loginUserWithEmailAndPassword = async (email: string, password: string): Promise<IUserDoc> => {
  const user = await getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
  try {
    const resetPasswordTokenDoc = await verificationTokenService.verifyVerificationToken(
      resetPasswordToken,
      TokenType.RESET_PASSWORD
    );
    const user = await getUserByEmail(resetPasswordTokenDoc.email);
    if (!user) {
      throw new Error();
    }
    await updateUserById(user.id, { password: newPassword });

    await VerificationToken.deleteMany({ email: user.email, type: TokenType.RESET_PASSWORD });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<IUserDoc | null>}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<IUserDoc | null> => {
  try {
    const verifyEmailTokenDoc = await verificationTokenService.verifyVerificationToken(
      verifyEmailToken,
      TokenType.VERIFY_EMAIL
    );
    const user = await getUserByEmail(verifyEmailTokenDoc.email);

    if (!user) {
      throw new Error();
    }

    await VerificationToken.deleteMany({ email: user.email, type: TokenType.VERIFY_EMAIL });
    const updatedUser = await updateUserById(user.id, { isEmailVerified: true });
    return updatedUser;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

/**
 * Verify magic link
 * @param {string} verifyMagicLinkToken
 * @returns {Promise<IUserDoc | null>}
 */
const verifyMagicLink = async (verifyMagicLinkToken: string): Promise<IUserDoc | null> => {
  try {
    const verifyMagicLinkTokenDoc = await verificationTokenService.verifyVerificationToken(
      verifyMagicLinkToken,
      TokenType.MAGIC_LINK
    );

    if (!verifyMagicLinkTokenDoc) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Expired or invalid magic link token');
    }

    // Create user if not exists and create account as well
    let user = await getUserByEmail(verifyMagicLinkTokenDoc.email);

    if (!user) {
      user = new User({
        email: verifyMagicLinkTokenDoc.email,
        name: '',
        image: '',
      });
      await user.save();

      const account = new Account({
        providerAccountId: user.id,
        provider: Provider.MAGIC_LINK,
        userId: user.id,
      });
      await account.save();
    }
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Magic link verification failed');
  }
};

export const accountService = {
  getUserAccount,
  updateUserAccount,
  generateToken,
  generateAuthTokens,
  updateAccountTokens,
  loginUserWithEmailAndPassword,
  resetPassword,
  verifyEmail,
  verifyMagicLink,
};
