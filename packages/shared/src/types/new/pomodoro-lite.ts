export enum TimerStage {
  Focus = 'focus',
  Break = 'break',
}

export interface TimerDurations {
  [TimerStage.Focus]: number;
  [TimerStage.Break]: number;
}

export interface TimerSettings {
  notifications: boolean;
  sounds: boolean;
}

export interface TimerStats {
  focusSec: number;
  breakSec: number;
}

export interface TimerDeps {
  now: () => number;
  pushUsage: (seconds: number) => Promise<void>;
  pushSettings: (settings: TimerSettings) => Promise<void>;
}

export interface TimerState {
  stage: TimerStage;
  isRunning: boolean;
  endTimestamp: number | null;
  durations: TimerDurations;
  settings: TimerSettings;
  stats: TimerStats;
  dailyLimitSec: number;
  unsyncedFocusSec: number;
  prevRemaining: number | null;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipToStage: (stage: TimerStage) => void;
  updateDurations: (durations: Partial<{ focus: number; break: number }>) => void;
  toggleNotifications: () => void;
  toggleSounds: () => void;
  updateRemaining: (remaining: number) => void;
  getLimitStatus: () => { isLimitReached: boolean; remainingSec: number };
  sync: () => Promise<void>;
  restore: () => void;
}
