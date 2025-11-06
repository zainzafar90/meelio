export type AuthRole = "user" | "guest";

export interface PomodoroSettings {
  workDuration: number;
  breakDuration: number;
  autoStart: boolean;
  autoBlock: boolean;
  soundOn: boolean;
  notificationSoundId?: string;
  notificationSoundEnabled: boolean;
  dailyFocusLimit: number;
}

export interface UserSettings {
  pomodoro: PomodoroSettings;
  onboardingCompleted: boolean;
  task: {
    confettiOnComplete: boolean;
  };
  calendar: {
    enabled: boolean;
  };
  weather?: {
    locationKey?: string;
    locationName?: string;
  };
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  role: AuthRole;
  image?: string;
  provider?: string;
  providerId?: string;
  isPro: boolean;
  subscriptionId?: string;
  settings?: UserSettings;
  locationKey?: string;
  locationName?: string;
};

export interface GuestUser {
  id: string;
  name: string;
  role: AuthRole;
  createdAt: string;
}
