export interface TimerMessage {
  type:
    | 'START'
    | 'PAUSE'
    | 'RESET'
    | 'UPDATE_DURATION'
    | 'SKIP_TO_NEXT_STAGE';
  duration?: number;
}

export interface TickMessage {
  type: 'TICK';
  remaining: number;
}

export interface StageCompleteMessage {
  type: 'STAGE_COMPLETE';
}

export interface PausedMessage {
  type: 'PAUSED';
  remaining: number;
}

export interface ResetCompleteMessage {
  type: 'RESET_COMPLETE';
}

export type TimerEvent =
  | TickMessage
  | StageCompleteMessage
  | PausedMessage
  | ResetCompleteMessage;
