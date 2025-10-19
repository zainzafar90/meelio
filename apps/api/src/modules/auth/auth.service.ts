import { and, desc, eq, lt, or } from "drizzle-orm";
import httpStatus from "http-status";
import moment from "moment";
import jwt from "jsonwebtoken";

import { ApiError } from "@/common/errors/api-error";
import { db } from "@/db";
import { logger } from "@repo/logger";

import { Provider, VerificationTokenType } from "@/types/enums.types";
import { Moment } from "moment";
import { config } from "@/config/config";
import {
  IAccessAndRefreshTokens,
  ISession,
  IUser,
  IPayload,
} from "@/types/interfaces/resources";
import {
  AccountInsert,
  accounts,
  sessions,
  SessionInsertTable,
  subscriptions,
  users,
} from "@/db/schema";
import { userUtils } from "../user/user.utils";
import { verificationTokenService } from "../verification-token";
import { userService } from "../user";
import { RoleType } from "@/types/enums.types";
import { subscriptionService } from "../subscription/subscription.service";
/**
 * Generate token
 * @param {string} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [sessionId]
 * @param {string} [secret]
 * @returns {string}
 */
export const generateToken = (
  userId: string,
  expires: Moment,
  type: "access" | "refresh",
  sessionId?: string,
  secret: string = config.jwt.secret,
): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    ...(sessionId && { sessionId }),
  };
  return jwt.sign(payload, secret);
};

/**
 * Verify JWT token and return payload
 * @param {string} token
 * @returns {Promise<IPayload>}
 */
const verifyJwtToken = async (token: string): Promise<IPayload> => {
  if (!token) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Authentication token is missing",
    );
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as IPayload;
    if (!payload || !payload.sub || typeof payload.sub !== "string") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Token payload is malformed or bad user",
      );
    }
    return payload;
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
  }
};

/**
 * Verify session exists and is not blacklisted
 * @param {string} sessionId
 * @returns {Promise<ISession>}
 */
const verifySession = async (sessionId: string): Promise<ISession> => {
  const sessionDoc = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      eq(sessions.blacklisted, false),
    ),
  });

  if (!sessionDoc) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Session not found or expired");
  }
  return sessionDoc;
};

/**
 * Verify token and return session (optimized with session ID lookup)
 * @param {string} token
 * @returns {Promise<ISession>}
 */
const verifyToken = async (token: string): Promise<ISession> => {
  const payload = await verifyJwtToken(token);

  // For new tokens with sessionId, use direct lookup
  if (payload.sessionId) {
    return await verifySession(payload.sessionId);
  }

  // Fallback for old tokens without sessionId
  const sessionDoc = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.accessToken, token),
      eq(sessions.blacklisted, false),
    ),
  });

  if (!sessionDoc) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Session not found or expired");
  }
  return sessionDoc;
};

/**
 * Generate auth tokens with session tracking
 * @param {IUser} user
 * @param {string} provider
 * @param {string} [deviceInfo]
 * @returns {Promise<IAccessAndRefreshTokens & { sessionId: string }>}
 */
const generateAuthTokens = async (
  user: IUser,
  provider: Provider,
  deviceInfo?: string,
): Promise<IAccessAndRefreshTokens & { sessionId: string }> => {
  const accessExpiration = moment().add(
    config.jwt.accessExpirationMinutes,
    "minutes",
  );
  const refreshExpiration = moment().add(
    config.jwt.refreshExpirationDays,
    "days",
  );

  // Create session first to get ID
  const sessionData = {
    userId: user.id!,
    provider,
    accessToken: "", // Will be updated after token generation
    accessTokenExpires: accessExpiration.toDate(),
    refreshToken: "", // Will be updated after token generation
    refreshTokenExpires: refreshExpiration.toDate(),
    deviceInfo,
  } as SessionInsertTable;

  const [sessionResult] = await db.insert(sessions).values(sessionData).returning({ id: sessions.id });
  const sessionId = sessionResult.id;

  // Generate tokens with session ID
  const accessToken = generateToken(user.id!, accessExpiration, "access", sessionId);
  const refreshToken = generateToken(user.id!, refreshExpiration, "refresh", sessionId);

  // Update session with actual tokens  
  await db.update(sessions)
    .set({
      accessToken,
      refreshToken,
    } as Partial<SessionInsertTable>)
    .where(eq(sessions.id, sessionId));

  return {
    access: {
      token: accessToken,
      expires: accessExpiration.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshExpiration.toDate(),
    },
    sessionId,
  };
};

// Removed - session creation is now handled in generateAuthTokens

/**
 * Ensure account exists for provider
 * @param {string} userId
 * @param {string} provider
 */
const ensureAccountExists = async (
  userId: string,
  provider: Provider,
  database = db,
): Promise<void> => {
  const account = await database.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, userId),
      eq(accounts.provider, provider),
    ),
  });

  if (!account) {
    await database
      .insert(accounts)
      .values({ userId, provider } as AccountInsert);
  }
};

const logoutSession = async (
  accessToken: string,
  database = db,
): Promise<void> => {
  const session = await verifyToken(accessToken);
  await database
    .update(sessions)
    .set({ blacklisted: true } as Partial<SessionInsertTable>)
    .where(eq(sessions.id, session.id));
};

/**
 * Logout all sessions for a user
 * @param {string} userId
 */
const logoutAllUserSessions = async (
  userId: string,
  database = db,
): Promise<void> => {
  await database
    .update(sessions)
    .set({ blacklisted: true } as Partial<SessionInsertTable>)
    .where(eq(sessions.userId, userId));
};

/**
 * Clean up expired sessions (should be run periodically)
 */
const cleanupExpiredSessions = async (database = db): Promise<number> => {
  const now = new Date();
  const result = await database
    .update(sessions)
    .set({ blacklisted: true } as Partial<SessionInsertTable>)
    .where(
      and(
        eq(sessions.blacklisted, false),
        or(
          lt(sessions.accessTokenExpires, now),
          lt(sessions.refreshTokenExpires, now)
        )
      )
    );

  return result.rowCount || 0;
};

/**
 * Check if the user has an active or future subscription.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const checkSubscription = async (
  email: string,
): Promise<{
  isPro: boolean;
  subscriptionId: string | null;
}> => {
  const subscription = await subscriptionService.getSubscriptionByEmail(email);

  if (!subscription)
    return {
      isPro: false,
      subscriptionId: null,
    };

  return {
    isPro: !!subscription,
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
  includeId?: boolean,
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
  updateBody: IUser,
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
  password: string,
): Promise<IUser> => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  const account = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, user?.id),
      eq(accounts.provider, Provider.PASSWORD),
    ),
  });

  if (!account) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "This email is registered with a different provider. Please make sure you are using the right email and password.",
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
  newPassword: string,
): Promise<void> => {
  try {
    const resetPasswordTokenDoc =
      await verificationTokenService.verifyVerificationToken(
        resetPasswordToken,
        VerificationTokenType.RESET_PASSWORD,
      );
    const user = await userService.getUserByEmail(resetPasswordTokenDoc.email);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });

    await verificationTokenService.deleteMany(
      user.email,
      VerificationTokenType.RESET_PASSWORD,
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
        VerificationTokenType.VERIFY_EMAIL,
      );
    const user = await userService.getUserByEmail(verifyEmailTokenDoc.email);

    if (!user) {
      throw new Error();
    }

    await verificationTokenService.deleteMany(
      user.email,
      VerificationTokenType.VERIFY_EMAIL,
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
  verifyMagicLinkToken: string,
): Promise<IUser | null> => {
  try {
    const verifyMagicLinkTokenDoc =
      await verificationTokenService.verifyVerificationToken(
        verifyMagicLinkToken,
        VerificationTokenType.MAGIC_LINK,
      );

    if (!verifyMagicLinkTokenDoc) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Expired or invalid magic link token",
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
              "Failed to retrieve existing user",
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
        eq(accounts.provider, Provider.MAGIC_LINK),
      ),
    });

    if (!existingAccount && user.id) {
      await db.insert(accounts).values({
        providerAccountId: user.id,
        provider: Provider.MAGIC_LINK,
        userId: user.id,
      } as AccountInsert);
    }

    return user;
  } catch (error) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Magic link verification failed",
    );
  }
};

/**
 * Refresh auth tokens using refresh token
 * @param {string} refreshToken
 * @returns {Promise<IAccessAndRefreshTokens>}
 */
const refreshAuthTokens = async (
  refreshToken: string,
): Promise<IAccessAndRefreshTokens & { sessionId: string }> => {
  try {
    const payload = await verifyJwtToken(refreshToken);

    if (payload.type !== "refresh") {
      logger.warn("Token refresh failed: Invalid token type");
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid token type",
      );
    }

    const session = payload.sessionId
      ? await verifySession(payload.sessionId)
      : await db.query.sessions.findFirst({
        where: and(
          eq(sessions.refreshToken, refreshToken),
          eq(sessions.blacklisted, false),
        ),
      });

    if (!session) {
      logger.warn(`Token refresh failed: Session not found or expired - sessionId: ${payload.sessionId}`);
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Session not found or expired",
      );
    }

    if (session.refreshToken !== refreshToken) {
      logger.error(`SECURITY: Refresh token reuse detected - blacklisting session ${session.id} for user ${session.userId} (provider: ${session.provider})`);

      await db
        .update(sessions)
        .set({ blacklisted: true } as Partial<SessionInsertTable>)
        .where(eq(sessions.id, session.id));

      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Refresh token has already been used or is invalid",
      );
    }

    if (session.refreshTokenExpires && new Date() > new Date(session.refreshTokenExpires)) {
      logger.info(`Token refresh failed: Refresh token expired for session ${session.id}, user ${session.userId}`);
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Refresh token has expired",
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      logger.error(`Token refresh failed: User not found - userId: ${session.userId}, sessionId: ${session.id}`);
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const accessExpiration = moment().add(
      config.jwt.accessExpirationMinutes,
      "minutes",
    );
    const refreshExpiration = moment().add(
      config.jwt.refreshExpirationDays,
      "days",
    );

    const newAccessToken = generateToken(
      user.id!,
      accessExpiration,
      "access",
      session.id,
    );
    const newRefreshToken = generateToken(
      user.id!,
      refreshExpiration,
      "refresh",
      session.id,
    );

    await db
      .update(sessions)
      .set({
        accessToken: newAccessToken,
        accessTokenExpires: accessExpiration.toDate(),
        refreshToken: newRefreshToken,
        refreshTokenExpires: refreshExpiration.toDate(),
      } as Partial<SessionInsertTable>)
      .where(eq(sessions.id, session.id));

    logger.info(`Token refresh successful for user ${user.id}, session ${session.id}`);

    return {
      access: {
        token: newAccessToken,
        expires: accessExpiration.toDate(),
      },
      refresh: {
        token: newRefreshToken,
        expires: refreshExpiration.toDate(),
      },
      sessionId: session.id,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error(`Unexpected error during token refresh: ${error instanceof Error ? error.message : String(error)}`);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Token refresh failed due to server error"
    );
  }
};

export const accountService = {
  getUserAccount,
  updateUserAccount,
  generateToken,
  generateAuthTokens,
  refreshAuthTokens,
  ensureAccountExists,
  logoutSession,
  logoutAllUserSessions,
  cleanupExpiredSessions,
  loginUserWithEmailAndPassword,
  resetPassword,
  verifyEmail,
  verifyMagicLink,
};
