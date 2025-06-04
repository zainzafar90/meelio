import { PomodoroSettings } from "../types/auth";

export const DEFAULT_SETTINGS: {
  pomodoro: PomodoroSettings;
  onboardingCompleted: boolean;
} = {
  pomodoro: {
    workDuration: 25,
    breakDuration: 5,
    autoStart: false,
    autoBlock: false,
    soundOn: true,
    dailyFocusLimit: 120,
  },
  onboardingCompleted: false,
};
