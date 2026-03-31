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
  soundId: string;
  soundscapes: boolean;
  autoStartBreaks: boolean;
}

export interface TimerStats {
  focusSec: number;
  breakSec: number;
}

export interface StartMessage {
  type: "START";
  duration: number;
  stage: TimerStage;
}

export interface PauseMessage {
  type: "PAUSE";
}

export interface ResetMessage {
  type: "RESET";
  stage: TimerStage;
}

export interface UpdateDurationMessage {
  type: "UPDATE_DURATION";
  duration: number;
}

export interface SkipStageMessage {
  type: "SKIP_TO_NEXT_STAGE";
  nextStage: TimerStage;
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
  finishedStage: TimerStage;
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

export interface TimerRuntimeAdapter {
  sendMessage(message: TimerMessage): void;
  subscribe(callback: (message: TimerEvent) => void): () => void;
  showNotification(title: string, message: string): void;
  requestNotificationPermission?: () => Promise<boolean>;
}
