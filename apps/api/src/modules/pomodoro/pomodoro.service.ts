import { db } from "@/db";
import { pomodoroSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const pomodoroService = {
  /**
   * Get pomodoro settings for a user
   * @param {string} userId - The user ID
   * @returns {Promise<object>} The pomodoro settings
   */
  getPomodoroSettings: async (userId: string) => {
    const settings = await db
      .select()
      .from(pomodoroSettings)
      .where(eq(pomodoroSettings.userId, userId));

    if (settings.length === 0) {
      // Return default settings if none exist
      return {
        workDuration: 25,
        breakDuration: 5,
        autoStart: false,
        autoBlock: false,
        soundOn: true,
        dailyFocusLimit: 120,
      };
    }

    return settings[0];
  },

  /**
   * Create or update pomodoro settings for a user
   * @param {string} userId - The user ID
   * @param {object} settingsData - The pomodoro settings data
   * @returns {Promise<object>} The created or updated pomodoro settings
   */
  createOrUpdatePomodoroSettings: async (userId: string, settingsData: any) => {
    // Check if settings already exist
    const existingSettings = await db
      .select()
      .from(pomodoroSettings)
      .where(eq(pomodoroSettings.userId, userId));

    if (existingSettings.length > 0) {
      // Update existing settings
      const result = await db
        .update(pomodoroSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(pomodoroSettings.userId, userId))
        .returning();

      return result[0];
    } else {
      // Create new settings
      const result = await db
        .insert(pomodoroSettings)
        .values({
          userId,
          ...settingsData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return result[0];
    }
  },
};
