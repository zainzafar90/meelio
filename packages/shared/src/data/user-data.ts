import { PomodoroSettings } from "../types/auth";

export const DEFAULT_SETTINGS: {
  pomodoro: PomodoroSettings;
  onboardingCompleted: boolean;
  task: { confettiOnComplete: boolean };
} = {
  pomodoro: {
    workDuration: 25,
    breakDuration: 5,
    autoStart: false,
    autoBlock: false,
    soundOn: true,
    dailyFocusLimit: 120,
    notificationSoundEnabled: true,
  },
  onboardingCompleted: false,
  task: {
    confettiOnComplete: false,
  },
};
