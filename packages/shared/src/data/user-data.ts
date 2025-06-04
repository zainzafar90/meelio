import { PomodoroSettings } from "../types/auth";

export const DEFAULT_SETTINGS: {
  pomodoro: PomodoroSettings;
  onboardingCompleted: boolean;
  todo: { confettiOnComplete: boolean };
} = {
  pomodoro: {
    workDuration: 25,
    breakDuration: 5,
    soundOn: true,
    dailyFocusLimit: 120,
    notificationSoundEnabled: false,
    autoStart: false,
  },
  onboardingCompleted: false,
  todo: {
    confettiOnComplete: false,
  },
};
