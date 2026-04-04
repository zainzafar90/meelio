import {
  TimerStage,
  type TimerDurations,
  type TimerSettings,
  type TimerStats,
} from "@repo/contracts/timer";

export const DEFAULT_TIMER_DURATIONS: TimerDurations = {
  [TimerStage.Focus]: 25 * 60,
  [TimerStage.Break]: 5 * 60,
};

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  notifications: true,
  sounds: true,
  soundId: "timeout-1-back-chime",
  soundscapes: true,
  autoStartBreaks: true,
};

export const DEFAULT_TIMER_STATS: TimerStats = {
  focusSec: 0,
  breakSec: 0,
};
