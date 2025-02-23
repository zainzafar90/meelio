import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import httpStatus from "http-status";
import {
  CreateUserReq,
  RegisterUserReq,
  UpdateUserReq,
} from "@/types/api/api-payloads";
import { RoleType } from "@/types/role.types";

import { ApiError } from "@/common/errors/api-error";
import { db } from "@/db";
import { User, UserInsert, users } from "@/db/schema";

import { getPaginationConfig } from "../paginate/pagination";
import { hashPassword, sanitizeUser } from "./user.utils";
import { IOptions } from "@/types/interfaces/pagination";

type OrderDirection = "asc" | "desc";
type OrderField = keyof (typeof users)["_"]["columns"];

interface OrderParams {
  field: OrderField;
  direction: OrderDirection;
}

const userDTO = (user: User) => {
  const sanitizedUser = sanitizeUser(user);
  return {
    ...sanitizedUser,
  };
};

export const isEmailTaken = async (email: string, excludeUserId?: string) => {
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
};

export const createUser = async (userBody: CreateUserReq) => {
  const isEmailAlreadyTaken = await isEmailTaken(userBody.email);
  if (isEmailAlreadyTaken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  const hashedPassword = await hashPassword(userBody.password);
  const [user] = await db
    .insert(users)
    .values({
      ...userBody,
      role: RoleType.User,
      password: hashedPassword,
    } as UserInsert)
    .returning();

  return userDTO(user);
};

export const registerUser = async (userBody: RegisterUserReq) => {
  const isEmailAlreadyTaken = await isEmailTaken(userBody.email);
  if (isEmailAlreadyTaken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  const hashedPassword = await hashPassword(userBody.password);
  const [user] = await db
    .insert(users)
    .values({
      ...userBody,
      role: RoleType.User,
      password: hashedPassword,
    } as UserInsert)
    .returning();

  return userDTO(user);
};

export const queryUsers = async (
  filter: Record<string, any>,
  options: IOptions
) => {
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

  const orderFn = orderParams.direction === "asc" ? asc : desc;
  const orderByClause = orderFn(
    users[orderParams.field as keyof (typeof users)["_"]["columns"]]
  );

  const [usersCount] = await db
    .select({ count: count(users.id) })
    .from(users)
    .where(whereClause);

  const results = await db.query.users.findMany({
    where: whereClause,
    limit,
    offset,
    orderBy: orderByClause,
  });

  return {
    results: results.map((user) => userDTO(user)),
    limit,
    offset,
    pages: Math.ceil(usersCount.count / limit),
    count: usersCount.count,
  };
};

export const updateUserById = async (id: string, userBody: UpdateUserReq) => {
  if (userBody.password) {
    userBody.password = await hashPassword(userBody.password);
  }

  const [updatedUser] = await db
    .update(users)
    .set(userBody)
    .where(eq(users.id, id))
    .returning();

  return userDTO(updatedUser);
};

export const updateUserPassword = async (
  userId: string,
  updatedPassword: string
) => {
  const conditions = [eq(users.id, userId)];
  const whereClause = and(...conditions);
  const user = await db.query.users.findFirst({
    where: whereClause,
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const newHashedPassword = await hashPassword(updatedPassword);
  await db
    .update(users)
    .set({ password: newHashedPassword } as User)
    .where(whereClause);
  return userDTO(user);
};

export const deleteUserById = async (id: string) => {
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  return userDTO(deletedUser);
};

export const getUserById = async (id: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) return null;

  return userDTO(user);
};

export const getMe = async (id: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) return null;

  return userDTO(user);
};

export const getUserByEmail = async (email: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) return null;

  return userDTO(user);
};

export const getUserByEmailAndPassword = async (email: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) return null;

  return user;
};
