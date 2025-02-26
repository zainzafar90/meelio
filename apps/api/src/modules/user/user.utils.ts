import bcrypt from "bcryptjs";

import { User } from "@/db/schema";

export type SafeUser = Omit<User, "password">;

export const userUtils = {
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, 8);
  },

  verifyPassword: async (
    password: string,
    hashedPassword: string
  ): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
  },

  sanitizeUser: (user: User) => {
    const { password, ...safeUser } = user;
    return safeUser;
  },
};
