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
}

export type LocalUser = {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: number;
  settings?: UserSettings;
};

export type AuthUser = LocalUser;

export interface GuestUser {
  id: string;
  name?: string;
  role: AuthRole;
  createdAt?: string;
}
