import { db } from "@/db";
import { DEFAULT_SETTINGS, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { IUser, IUserSettings } from "@/types/interfaces/resources";

class SettingsService {
  async getSettings(userId: string): Promise<IUserSettings> {
    const [user] = (await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)) as [IUser];

    if (!user) {
      throw new Error("User not found");
    }

    const settings = user.settings;

    if (!settings || Object.keys(settings).length === 0) {
      return DEFAULT_SETTINGS;
    }

    return settings;
  }

  async updateSettings(
    userId: string,
    updates: Partial<IUserSettings>
  ): Promise<IUserSettings> {
    const [user] = (await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)) as [IUser];

    if (!user) {
      throw new Error("User not found");
    }

    let currentSettings = user.settings as IUserSettings;

    if (Object.keys(currentSettings).length === 0) {
      currentSettings = DEFAULT_SETTINGS;
    }

    const newSettings: IUserSettings = {
      ...currentSettings,
    };

    console.log("updates", updates);
    if (updates.pomodoro) {
      newSettings.pomodoro = {
        ...currentSettings.pomodoro,
        ...updates.pomodoro,
      };
      console.log("newSettings", newSettings);
    }

    Object.assign(user, { settings: newSettings });
    console.log("user", user);
    await db.update(users).set(user).where(eq(users.id, userId));

    const [updatedUser] = (await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)) as [IUser];

    console.log("updatedUser", updatedUser);

    return newSettings;
  }

  async getPomodoroSettings(userId: string) {
    const settings = await this.getSettings(userId);
    return settings.pomodoro || DEFAULT_SETTINGS.pomodoro;
  }

  async updatePomodoroSettings(userId: string, pomodoroSettings: any) {
    return this.updateSettings(userId, { pomodoro: pomodoroSettings });
  }
}

export const settingsService = new SettingsService();
