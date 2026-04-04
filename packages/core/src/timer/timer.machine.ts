import {
  TimerStage,
  type TimerDurations,
  type TimerSettings,
  type TimerStats,
} from "@repo/contracts/timer";
import {
  DEFAULT_TIMER_DURATIONS,
  DEFAULT_TIMER_SETTINGS,
  DEFAULT_TIMER_STATS,
} from "./timer.defaults";

export interface TimerSnapshot {
  stage: TimerStage;
  isRunning: boolean;
  endTimestamp: number | null;
  durations: TimerDurations;
  settings: TimerSettings;
  stats: TimerStats;
  unsyncedFocusSec: number;
  prevRemaining: number | null;
}

export interface TimerDurationPatch {
  focus?: number;
  break?: number;
}

export const createInitialTimerSnapshot = (
  overrides: Partial<TimerSnapshot> = {}
): TimerSnapshot => ({
  stage: overrides.stage ?? TimerStage.Focus,
  isRunning: overrides.isRunning ?? false,
  endTimestamp: overrides.endTimestamp ?? null,
  durations: {
    ...DEFAULT_TIMER_DURATIONS,
    ...overrides.durations,
  },
  settings: {
    ...DEFAULT_TIMER_SETTINGS,
    ...overrides.settings,
  },
  stats: {
    ...DEFAULT_TIMER_STATS,
    ...overrides.stats,
  },
  unsyncedFocusSec: overrides.unsyncedFocusSec ?? 0,
  prevRemaining: overrides.prevRemaining ?? null,
});

export const getNextTimerStage = (stage: TimerStage): TimerStage =>
  stage === TimerStage.Focus ? TimerStage.Break : TimerStage.Focus;

export const getTimerRemaining = (
  state: TimerSnapshot,
  now: number
): number => {
  if (state.endTimestamp !== null) {
    return Math.max(0, Math.ceil((state.endTimestamp - now) / 1000));
  }

  if (state.prevRemaining !== null) {
    return state.prevRemaining;
  }

  return state.durations[state.stage];
};

export const startTimer = (
  state: TimerSnapshot,
  now: number
): TimerSnapshot => {
  const duration = state.prevRemaining ?? state.durations[state.stage];

  return {
    ...state,
    isRunning: true,
    endTimestamp: now + duration * 1000,
    prevRemaining: duration,
  };
};

export const pauseTimer = (
  state: TimerSnapshot,
  now: number
): TimerSnapshot => ({
  ...state,
  isRunning: false,
  endTimestamp: null,
  prevRemaining: getTimerRemaining(state, now),
});

export const resetTimer = (
  state: TimerSnapshot,
  stage: TimerStage = TimerStage.Focus
): TimerSnapshot => ({
  ...state,
  stage,
  isRunning: false,
  endTimestamp: null,
  stats: {
    ...DEFAULT_TIMER_STATS,
  },
  unsyncedFocusSec: 0,
  prevRemaining: state.durations[stage],
});

export const skipToTimerStage = (
  state: TimerSnapshot,
  stage: TimerStage
): TimerSnapshot => ({
  ...state,
  stage,
  isRunning: false,
  endTimestamp: null,
  prevRemaining: state.durations[stage],
});

export const updateTimerDurations = (
  state: TimerSnapshot,
  patch: TimerDurationPatch
): TimerSnapshot => {
  const durations: TimerDurations = {
    [TimerStage.Focus]: patch.focus ?? state.durations[TimerStage.Focus],
    [TimerStage.Break]: patch.break ?? state.durations[TimerStage.Break],
  };

  const activeStageKey = state.stage === TimerStage.Focus ? "focus" : "break";
  const shouldUpdatePrevRemaining =
    !state.isRunning && patch[activeStageKey] !== undefined;

  return {
    ...state,
    durations,
    prevRemaining: shouldUpdatePrevRemaining
      ? durations[state.stage]
      : state.prevRemaining,
  };
};

export const updateTimerRemaining = (
  state: TimerSnapshot,
  remaining: number
): TimerSnapshot => {
  if (state.prevRemaining === null || !state.isRunning) {
    return {
      ...state,
      prevRemaining: remaining,
    };
  }

  const diff = state.prevRemaining - remaining;
  if (diff <= 0) {
    return {
      ...state,
      prevRemaining: remaining,
    };
  }

  if (state.stage === TimerStage.Focus) {
    return {
      ...state,
      prevRemaining: remaining,
      stats: {
        ...state.stats,
        focusSec: state.stats.focusSec + diff,
      },
      unsyncedFocusSec: state.unsyncedFocusSec + diff,
    };
  }

  return {
    ...state,
    prevRemaining: remaining,
    stats: {
      ...state.stats,
      breakSec: state.stats.breakSec + diff,
    },
  };
};

export const completeTimerStage = (
  state: TimerSnapshot,
  finishedStage: TimerStage
): TimerSnapshot => {
  if (!state.isRunning || state.stage !== finishedStage) {
    return state;
  }

  const nextStage = getNextTimerStage(finishedStage);

  return {
    ...state,
    stage: nextStage,
    isRunning: false,
    endTimestamp: null,
    prevRemaining: state.durations[nextStage],
  };
};

export const restoreTimer = (
  state: TimerSnapshot,
  now: number
): TimerSnapshot => {
  if (!state.isRunning || state.endTimestamp === null) {
    return state;
  }

  const remaining = getTimerRemaining(state, now);
  if (remaining <= 0) {
    return {
      ...state,
      isRunning: false,
      endTimestamp: null,
    };
  }

  return {
    ...state,
    prevRemaining: remaining,
  };
};
