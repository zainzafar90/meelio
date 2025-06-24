import { and, desc, eq } from "drizzle-orm";
import httpStatus from "http-status";
import moment from "moment";
import jwt from "jsonwebtoken";

import { ApiError } from "@/common/errors/api-error";
import { db } from "@/db";

import { Provider, VerificationTokenType } from "@/types/enums.types";
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
  accounts,
  subscriptions,
  users,
} from "@/db/schema";
import { userUtils } from "../user/user.utils";
import { verificationTokenService } from "../verification-token";
import { userService } from "../user";
import { RoleType } from "@/types/enums.types";
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
  type: "access" | "refresh",
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

  const accessToken = generateToken(user.id, accessExpiration, "access");
  const refreshToken = generateToken(user.id, refreshExpiration, "refresh");

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
      eq(accounts.provider, provider as Provider)
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
    orderBy: desc(subscriptions.createdAt),
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

  const safeUser = userUtils.sanitizeUser(user);
  return {
    user: safeUser,
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

  const safeUser = userUtils.sanitizeUser(user);
  return {
    user: safeUser,
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

  const account = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, user?.id),
      eq(accounts.provider, Provider.PASSWORD)
    ),
  });

  if (!account) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "This email is registered with a different provider. Please make sure you are using the right email and password."
    );
  }

  if (!user || !(await userUtils.verifyPassword(password, user.password))) {
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
        VerificationTokenType.RESET_PASSWORD
      );
    const user = await userService.getUserByEmail(resetPasswordTokenDoc.email);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });

    await verificationTokenService.deleteMany(
      user.email,
      VerificationTokenType.RESET_PASSWORD
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
        VerificationTokenType.VERIFY_EMAIL
      );
    const user = await userService.getUserByEmail(verifyEmailTokenDoc.email);

    if (!user) {
      throw new Error();
    }

    await verificationTokenService.deleteMany(
      user.email,
      VerificationTokenType.VERIFY_EMAIL
    );
    const updatedUser = await userService.updateUserById(user.id, {
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
        VerificationTokenType.MAGIC_LINK
      );

    if (!verifyMagicLinkTokenDoc) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Expired or invalid magic link token"
      );
    }

    const email = verifyMagicLinkTokenDoc.email.toLowerCase();
    let user = await userService.getUserByEmail(email);

    if (!user) {
      try {
        user = await userService.createUserFromMagicLink({
          email,
          name: "",
          image: "",
          role: RoleType.User,
        });
      } catch (userError) {
        // Handle race condition with duplicate email
        // Faced it on local when there's duplicate call to createUserFromMagicLink, still want to be cautious
        if (userError.message?.includes("users_email_unique")) {
          user = await userService.getUserByEmail(email);
          if (!user) {
            throw new ApiError(
              httpStatus.INTERNAL_SERVER_ERROR,
              "Failed to retrieve existing user"
            );
          }
        } else {
          throw userError;
        }
      }
    }

    const existingAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.userId, user.id),
        eq(accounts.provider, Provider.MAGIC_LINK)
      ),
    });

    if (!existingAccount && user.id) {
      try {
        const tokens = await generateAuthTokens(user);
        await db.insert(accounts).values({
          providerAccountId: user.id,
          provider: Provider.MAGIC_LINK,
          userId: user.id,
          accessToken: tokens.access.token,
          accessTokenExpires: tokens.access.expires,
          refreshToken: tokens.refresh.token,
          refreshTokenExpires: tokens.refresh.expires,
        } as AccountInsert);
      } catch (accountError) {
        // Continue even if account creation fails - the user was created successfully
      }
    }

    return user;
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
