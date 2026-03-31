export * from "@repo/timer-core";

import type { TimerSnapshot } from "@repo/timer-core";
import type { TimerStage } from "@repo/timer-core";
import type { TimerSettings } from "@repo/timer-core";

export interface TimerDeps {
  now: () => number;
  pushUsage: (seconds: number) => Promise<void>;
  pushSettings: (settings: TimerSettings) => Promise<void>;
}

export interface TimerState extends TimerSnapshot {
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipToStage: (stage: TimerStage) => void;
  updateDurations: (
    durations: Partial<{ focus: number; break: number }>
  ) => void;
  toggleNotifications: () => void;
  toggleSounds: () => void;
  toggleSoundscapes: () => void;
  toggleAutoStartBreaks: () => void;
  setSoundId: (id: string) => void;
  updateRemaining: (remaining: number) => void;
  restore: () => void;
  completeStage: () => void;
  checkDailyReset: () => void;
  playCompletionSound: () => void;
  showCompletionNotification: (stage: TimerStage) => void;
}
