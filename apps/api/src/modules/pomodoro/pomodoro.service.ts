import { db } from "@/db";
import {
  PomodoroSetting,
  PomodoroSettingInsert,
  pomodoroSettings,
} from "@/db/schema";
import { eq } from "drizzle-orm";

interface PomodoroSettings {
  workDuration: number;
  breakDuration: number;
  autoStart: boolean;
  autoBlock: boolean;
  soundOn: boolean;
  dailyFocusLimit: number;
}

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  autoStart: false,
  autoBlock: false,
  soundOn: true,
  dailyFocusLimit: 120,
};

export const pomodoroService = {
  /**
   * Get pomodoro settings for a user
   */
  getPomodoroSettings: async (userId: string): Promise<PomodoroSettings> => {
    const settings = await db
      .select()
      .from(pomodoroSettings)
      .where(eq(pomodoroSettings.userId, userId));

    if (settings.length === 0) {
      return defaultSettings;
    }

    return settings[0];
  },

  /**
   * Create or update pomodoro settings for a user
   */
  createOrUpdatePomodoroSettings: async (
    userId: string,
    settingsData: Partial<PomodoroSettings>
  ): Promise<PomodoroSettings> => {
    const existingSettings = await db
      .select()
      .from(pomodoroSettings)
      .where(eq(pomodoroSettings.userId, userId));

    if (existingSettings.length > 0) {
      const updateData = {
        workDuration: settingsData.workDuration,
        breakDuration: settingsData.breakDuration,
        autoStart: settingsData.autoStart,
        autoBlock: settingsData.autoBlock,
        soundOn: settingsData.soundOn,
        dailyFocusLimit: settingsData.dailyFocusLimit,
        updatedAt: new Date(),
      };

      const result = await db
        .update(pomodoroSettings)
        .set(updateData as PomodoroSetting)
        .where(eq(pomodoroSettings.userId, userId))
        .returning();

      return result[0];
    } else {
      const result = await db
        .insert(pomodoroSettings)
        .values({
          userId,
          workDuration:
            settingsData.workDuration ?? defaultSettings.workDuration,
          breakDuration:
            settingsData.breakDuration ?? defaultSettings.breakDuration,
          autoStart: settingsData.autoStart ?? defaultSettings.autoStart,
          autoBlock: settingsData.autoBlock ?? defaultSettings.autoBlock,
          soundOn: settingsData.soundOn ?? defaultSettings.soundOn,
          dailyFocusLimit:
            settingsData.dailyFocusLimit ?? defaultSettings.dailyFocusLimit,
        } as PomodoroSettingInsert)
        .returning();

      return result[0];
    }
  },
};
