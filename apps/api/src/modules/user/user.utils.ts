import bcrypt from "bcryptjs";

import { User } from "@/db/schema";

export type SafeUser = Omit<User, "password">;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 8);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const sanitizeUser = (user: User): SafeUser => {
  const { password, ...safeUser } = user;
  return safeUser;
};
