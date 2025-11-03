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
      ...DEFAULT_SETTINGS,
      ...currentSettings,
      calendar: {
        ...DEFAULT_SETTINGS.calendar,
        ...currentSettings.calendar,
      },
    };

    if (updates.pomodoro) {
      newSettings.pomodoro = {
        ...currentSettings.pomodoro,
        ...updates.pomodoro,
      };
    }

    if (typeof updates.onboardingCompleted === "boolean") {
      newSettings.onboardingCompleted = updates.onboardingCompleted;
    }

    if (updates.task) {
      newSettings.task = {
        ...currentSettings.task,
        ...updates.task,
      };
    }

    if (updates.calendar) {
      newSettings.calendar = {
        ...currentSettings.calendar,
        ...updates.calendar,
      };
    }

    if (updates.weather) {
      newSettings.weather = {
        ...DEFAULT_SETTINGS.weather,
        ...currentSettings.weather,
        ...updates.weather,
      };
    }

    Object.assign(user, { settings: newSettings });
    await db.update(users).set(user).where(eq(users.id, userId));

    const [updatedUser] = (await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)) as [IUser];

    return newSettings;
  }

  async getPomodoroSettings(userId: string) {
    const settings = await this.getSettings(userId);
    return settings.pomodoro || DEFAULT_SETTINGS.pomodoro;
  }

  async updatePomodoroSettings(userId: string, pomodoroSettings: any) {
    return this.updateSettings(userId, { pomodoro: pomodoroSettings });
  }

  async getTaskSettings(userId: string) {
    const settings = await this.getSettings(userId);
    return settings.task || DEFAULT_SETTINGS.task;
  }

  async updateTaskSettings(userId: string, taskSettings: any) {
    return this.updateSettings(userId, { task: taskSettings });
  }

  async getCalendarSettings(userId: string) {
    const settings = await this.getSettings(userId);
    return settings.calendar || DEFAULT_SETTINGS.calendar;
  }

  async updateCalendarSettings(userId: string, calendarSettings: any) {
    return this.updateSettings(userId, { calendar: calendarSettings });
  }
}

export const settingsService = new SettingsService();
