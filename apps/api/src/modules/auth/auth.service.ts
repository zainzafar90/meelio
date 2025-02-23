import { and, eq } from "drizzle-orm";
import httpStatus from "http-status";
import moment from "moment";
import jwt from "jsonwebtoken";

import { ApiError } from "@/common/errors/api-error";
import { db } from "@/db";

import { Provider, TokenType } from "@/types/enums.types";
import { Moment } from "moment";
import { config } from "@/config/config";
import {
  IAccessAndRefreshTokens,
  IToken,
  IUser,
} from "@/types/interfaces/resources";
import {
  Account,
  AccountInsert,
  AccountProvider,
  accounts,
  subscriptions,
  users,
} from "@/db/schema";
import { verifyPassword } from "../user/user.utils";
import { verificationTokenService } from "../verification-token";
import { userService } from "../user";
import { updateUserById } from "../user/user.service";
import { RoleType } from "@/types/role.types";
/**
 * Generate token
 * @param {string} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
export const generateToken = (
  userId: string,
  expires: Moment,
  type: TokenType,
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
const verifyToken = async (token: string): Promise<IToken> => {
  if (!token) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Authentication token is missing"
    );
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
  }

  if (!payload || !payload.sub || typeof payload.sub !== "string") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Token payload is malformed or bad user"
    );
  }

  const accountTokenDoc = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.accessToken, token),
      eq(accounts.userId, payload.sub),
      eq(accounts.blacklisted, false)
    ),
  });

  if (!accountTokenDoc) {
    throw new Error("Token not found");
  }
  return accountTokenDoc;
};

/**
 * Generate auth tokens
 * @param {IUserDoc} user
 * @returns {Promise<AccountTokens>}
 */
const generateAuthTokens = async (
  user: IUser
): Promise<IAccessAndRefreshTokens> => {
  const accessExpiration = moment().add(
    config.jwt.accessExpirationMinutes,
    "minutes"
  );
  const refreshExpiration = moment().add(
    config.jwt.refreshExpirationDays,
    "days"
  );

  const accessToken = generateToken(
    user.id,
    accessExpiration,
    TokenType.ACCESS
  );
  const refreshToken = generateToken(
    user.id,
    refreshExpiration,
    TokenType.REFRESH
  );

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
const updateAccountTokens = async (
  userId: string,
  provider: string,
  tokens: IAccessAndRefreshTokens
): Promise<void> => {
  const account = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, userId),
      eq(accounts.provider, provider as AccountProvider)
    ),
  });

  if (account) {
    await db
      .update(accounts)
      .set({
        accessToken: tokens.access.token,
        accessTokenExpires: tokens.access.expires,
        refreshToken: tokens.refresh.token,
        refreshTokenExpires: tokens.refresh.expires,
      } as Account)
      .where(eq(accounts.id, account.id));
  } else {
    await db.insert(accounts).values({
      userId,
      provider,
      accessToken: tokens.access.token,
      accessTokenExpires: tokens.access.expires,
      refreshToken: tokens.refresh.token,
      refreshTokenExpires: tokens.refresh.expires,
    } as Account);
  }
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
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.email, email),
  });

  if (!subscription)
    return {
      isPro: false,
      subscriptionId: null,
    };

  const hasActiveSubscription =
    subscription.status === "active" ||
    (subscription.status === "cancelled" &&
      subscription.endsAt &&
      subscription.endsAt > new Date());

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
): Promise<{
  user: IUser;
  userId: string;
  isPro: boolean;
  subscriptionId: string | null;
} | null> => {
  const token = await verifyToken(accessToken);
  const user = await db.query.users.findFirst({
    where: eq(users.id, token.userId),
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const { isPro, subscriptionId } = await checkSubscription(user.email);

  return {
    user: user as IUser,
    isPro,
    subscriptionId,
    userId: includeId ? user.id : "",
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
): Promise<{
  user: IUser;
  isPro: boolean;
  subscriptionId: string | null;
} | null> => {
  const token = await verifyToken(accessToken);
  const user = await db.query.users.findFirst({
    where: eq(users.id, token.userId),
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  Object.assign(user, updateBody);
  await db.update(users).set(user).where(eq(users.id, user.id));

  const { isPro, subscriptionId } = await checkSubscription(user.email);

  return {
    user: user as IUser,
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
const loginUserWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<IUser> => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user || !(await verifyPassword(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  return user as IUser;
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (
  resetPasswordToken: string,
  newPassword: string
): Promise<void> => {
  try {
    const resetPasswordTokenDoc =
      await verificationTokenService.verifyVerificationToken(
        resetPasswordToken,
        TokenType.RESET_PASSWORD
      );
    const user = await userService.getUserByEmail(resetPasswordTokenDoc.email);
    if (!user) {
      throw new Error();
    }
    await updateUserById(user.id, { password: newPassword });

    await verificationTokenService.deleteMany(
      user.email,
      TokenType.RESET_PASSWORD
    );
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 */
const verifyEmail = async (verifyEmailToken: string): Promise<IUser | null> => {
  try {
    const verifyEmailTokenDoc =
      await verificationTokenService.verifyVerificationToken(
        verifyEmailToken,
        TokenType.VERIFY_EMAIL
      );
    const user = await userService.getUserByEmail(verifyEmailTokenDoc.email);

    if (!user) {
      throw new Error();
    }

    await verificationTokenService.deleteMany(
      user.email,
      TokenType.VERIFY_EMAIL
    );
    const updatedUser = await updateUserById(user.id, {
      isEmailVerified: true,
    });
    return updatedUser as IUser;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

/**
 * Verify magic link
 * @param {string} verifyMagicLinkToken
 */
const verifyMagicLink = async (
  verifyMagicLinkToken: string
): Promise<IUser | null> => {
  try {
    const verifyMagicLinkTokenDoc =
      await verificationTokenService.verifyVerificationToken(
        verifyMagicLinkToken,
        Provider.MAGIC_LINK
      );

    if (!verifyMagicLinkTokenDoc) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Expired or invalid magic link token"
      );
    }

    // Create user if not exists and create account as well
    let user = await userService.getUserByEmail(verifyMagicLinkTokenDoc.email);

    if (!user) {
      user = await userService.createUser({
        email: verifyMagicLinkTokenDoc.email,
        name: "",
        image: "",
        role: RoleType.User,
      });

      await db.insert(accounts).values({
        providerAccountId: user.id,
        provider: Provider.MAGIC_LINK,
        userId: user.id,
        role: RoleType.User,
      } as AccountInsert);
    }

    return user as IUser;
  } catch (error) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Magic link verification failed"
    );
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
