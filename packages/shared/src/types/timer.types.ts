export enum TimerStage {
  Focus = "focus",
  Break = "break",
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

export interface StartMessage {
  type: "START";
  duration: number;
}
export interface PauseMessage {
  type: "PAUSE";
}
export interface ResetMessage {
  type: "RESET";
}
export interface UpdateDurationMessage {
  type: "UPDATE_DURATION";
  duration: number;
}
export interface SkipStageMessage {
  type: "SKIP_TO_NEXT_STAGE";
}
export type TimerMessage =
  | StartMessage
  | PauseMessage
  | ResetMessage
  | UpdateDurationMessage
  | SkipStageMessage;

export interface TickMessage {
  type: "TICK";
  remaining: number;
}
export interface StageCompleteMessage {
  type: "STAGE_COMPLETE";
}
export interface PausedMessage {
  type: "PAUSED";
  remaining: number;
}
export interface ResetCompleteMessage {
  type: "RESET_COMPLETE";
}
export type TimerEvent =
  | TickMessage
  | StageCompleteMessage
  | PausedMessage
  | ResetCompleteMessage;

export interface TimerDeps {
  now: () => number;
  pushUsage: (seconds: number) => Promise<void>;
  pushSettings: (settings: TimerSettings) => Promise<void>;
  postMessage?: (msg: TimerMessage) => void;
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
  updateDurations: (
    durations: Partial<{ focus: number; break: number }>
  ) => void;
  toggleNotifications: () => void;
  toggleSounds: () => void;
  updateRemaining: (remaining: number) => void;
  getLimitStatus: () => { isLimitReached: boolean; remainingSec: number };
  sync: () => Promise<void>;
  restore: () => void;
  completeStage: () => void;
  checkDailyReset: () => void;
  playCompletionSound: () => void;
  showCompletionNotification: (stage: TimerStage) => void;
}
