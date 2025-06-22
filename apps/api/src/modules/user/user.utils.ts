import bcrypt from "bcryptjs";

import { User, DEFAULT_SETTINGS } from "@/db/schema";
import { IUser, IUserSettings } from "@/types/interfaces/resources";

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

    if (
      !safeUser.settings ||
      Object.keys(safeUser.settings as object).length === 0
    ) {
      safeUser.settings = DEFAULT_SETTINGS as typeof safeUser.settings;
    } else {
      const userSettings = safeUser.settings as IUserSettings;
      safeUser.settings = {
        pomodoro: {
          ...DEFAULT_SETTINGS.pomodoro,
          ...userSettings.pomodoro,
        },
        onboardingCompleted:
          userSettings.onboardingCompleted ??
          DEFAULT_SETTINGS.onboardingCompleted,
        task: {
          ...DEFAULT_SETTINGS.task,
          ...userSettings.task,
        },
        calendar: {
          ...DEFAULT_SETTINGS.calendar,
          ...userSettings.calendar,
        },
      } as typeof safeUser.settings;
    }

    return safeUser as IUser;
  },
};
