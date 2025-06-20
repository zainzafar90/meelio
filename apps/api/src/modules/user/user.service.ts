import { and, eq, ne } from "drizzle-orm";
import httpStatus from "http-status";
import {
  CreateUserReq,
  RegisterUserReq,
  UpdateUserReq,
} from "@/types/api/api-payloads";
import { RoleType } from "@/types/enums.types";

import { ApiError } from "@/common/errors/api-error";
import { db } from "@/db";
import { User, UserInsert, users } from "@/db/schema";

import { userUtils, SafeUser } from "./user.utils";
import { IUser } from "@/types";

export const userService = {
  userDTO: (user: User) => {
    const sanitizedUser = userUtils.sanitizeUser(user);
    return {
      ...sanitizedUser,
    };
  },

  isEmailTaken: async (email: string, excludeUserId?: string) => {
    if (excludeUserId) {
      const user = await db.query.users.findFirst({
        where: and(eq(users.email, email), ne(users.id, excludeUserId)),
      });
      return !!user;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return !!user;
  },

  createUser: async (userBody: CreateUserReq) => {
    if (await userService.isEmailTaken(userBody.email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }

    const hashedPassword = await userUtils.hashPassword(userBody.password);
    const [user] = await db
      .insert(users)
      .values({
        ...userBody,
        role: RoleType.User,
        password: hashedPassword,
      } as UserInsert)
      .returning();

    return user;
  },

  createUserFromMagicLink: async (userBody: CreateUserReq) => {
    const [user] = await db
      .insert(users)
      .values({
        ...userBody,
        role: RoleType.User,
      } as UserInsert)
      .returning();

    return user as IUser;
  },

  registerUser: async (userBody: RegisterUserReq) => {
    const isEmailAlreadyTaken = await userService.isEmailTaken(userBody.email);
    if (isEmailAlreadyTaken) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }

    const hashedPassword = await userUtils.hashPassword(userBody.password);
    const [user] = await db
      .insert(users)
      .values({
        ...userBody,
        role: RoleType.User,
        password: hashedPassword,
      } as UserInsert)
      .returning();

    return userUtils.sanitizeUser(user);
  },

  getUserById: async (id: string) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return null;
    }

    return userService.userDTO(user);
  },

  getUserByEmail: async (email: string): Promise<IUser | null> => {
    const user = (await db.query.users.findFirst({
      where: eq(users.email, email),
    })) as IUser;

    if (!user) {
      return null;
    }

    return user;
  },

  updateUserById: async (
    userId: string,
    updateBody: UpdateUserReq
  ): Promise<IUser> => {
    const user = await userService.getUserById(userId);

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (
      updateBody.email &&
      (await userService.isEmailTaken(updateBody.email, userId))
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }

    const updatedUser = { ...updateBody };

    if (updateBody.password) {
      updatedUser.password = await userUtils.hashPassword(updateBody.password);
    }

    const [updatedUserResult] = await db
      .update(users)
      .set(updatedUser)
      .where(eq(users.id, userId))
      .returning();

    return userService.userDTO(updatedUserResult);
  },

  deleteUserById: async (userId: string) => {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    await db.delete(users).where(eq(users.id, userId));
    return user;
  },

  getMe: async (userId: string) => {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
  },

  // createGuestUser: async (name: string) => {
  //   const [user] = await db
  //     .insert(users)
  //     .values({
  //       name: name || "Guest",
  //       email: `guest-${Date.now()}@meelio.com`,
  //       role: RoleType.Guest,
  //       isGuest: true,
  //     } as UserInsert)
  //     .returning();

  //   return userService.userDTO(user);
  // },

  updateGuestToRegular: async (
    userId: string,
    { email, password }: { email: string; password: string }
  ): Promise<SafeUser> => {
    const user = await userService.getUserById(userId);

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role !== RoleType.Guest) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User is already a regular user"
      );
    }

    if (await userService.isEmailTaken(email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }

    const hashedPassword = await userUtils.hashPassword(password);

    const [updatedUser] = await db
      .update(users)
      .set({
        email,
        password: hashedPassword,
        role: RoleType.User,
      } as User)
      .where(eq(users.id, userId))
      .returning();

    return userService.userDTO(updatedUser) as SafeUser;
  },
};
