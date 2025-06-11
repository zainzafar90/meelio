import { PomodoroSettings, UserSettings } from "../types/auth";
import { axios } from "./axios";

export const settingsApi = {
  updateSettings: async (settings: Partial<UserSettings>) => {
    const response = await axios.patch("/v1/settings", settings);
    return response.data.settings;
  },

  updatePomodoroSettings: async (
    pomodoroSettings: Partial<PomodoroSettings>
  ) => {
    const response = await axios.patch(
      "/v1/settings/pomodoro",
      pomodoroSettings
    );
    return response.data.settings;
  },

  updateTaskSettings: async (taskSettings: { confettiOnComplete: boolean }) => {
    const response = await axios.patch("/v1/settings/task", taskSettings);
    return response.data.settings;
  },
};
