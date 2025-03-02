import { and, asc, count, desc, eq, ne } from "drizzle-orm";
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

import { getPaginationConfig } from "../paginate/pagination";
import { userUtils, SafeUser } from "./user.utils";
import { IOptions } from "@/types/interfaces/pagination";
import { IUser } from "@/types";

type OrderDirection = "asc" | "desc";
type OrderField = keyof (typeof users)["_"]["columns"];

interface OrderParams {
  field: OrderField;
  direction: OrderDirection;
}

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

  queryUsers: async (filter: Record<string, any>, options: IOptions) => {
    const { limit, offset } = getPaginationConfig(options);

    const conditions = [];
    if (filter.name) {
      conditions.push(eq(users.name, filter.name));
    }

    const whereClause = and(...conditions);

    const orderParams: OrderParams = {
      field: (options.sortBy as OrderField) || "createdAt",
      direction: (options.sortOrder as OrderDirection) || "desc",
    };

    const orderBy =
      orderParams.direction === "asc"
        ? asc(users[orderParams.field])
        : desc(users[orderParams.field]);

    const [result, total] = await Promise.all([
      db.query.users.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [orderBy],
      }),
      db
        .select({ count: count() })
        .from(users)
        .where(whereClause)
        .then((result) => result[0].count),
    ]);

    return {
      results: result.map(userService.userDTO),
      total,
      limit,
      offset,
      pages: Math.ceil(total / limit),
      count: result.length,
    };
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
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

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

    return userService.userDTO(updatedUser);
  },
};
