import { describe, expect, it } from "vitest";

import {
  TimerStage,
  completeTimerStage,
  createInitialTimerSnapshot,
  getNextTimerStage,
  getTimerRemaining,
  pauseTimer,
  resetTimer,
  skipToTimerStage,
  startTimer,
  updateTimerDurations,
  updateTimerRemaining,
} from "./index";

describe("timer-core machine", () => {
  it("creates default focus state, durations, and settings", () => {
    const state = createInitialTimerSnapshot();

    expect(state).toMatchObject({
      stage: TimerStage.Focus,
      isRunning: false,
      endTimestamp: null,
      prevRemaining: null,
      durations: {
        [TimerStage.Focus]: 25 * 60,
        [TimerStage.Break]: 5 * 60,
      },
      settings: {
        notifications: true,
        sounds: true,
        soundId: "timeout-1-back-chime",
        soundscapes: true,
        autoStartBreaks: true,
      },
      stats: {
        focusSec: 0,
        breakSec: 0,
      },
      unsyncedFocusSec: 0,
    });
  });

  it("starts and pauses a focus session using wall-clock time", () => {
    const now = 1_700_000_000_000;
    const started = startTimer(createInitialTimerSnapshot(), now);

    expect(started.isRunning).toBe(true);
    expect(started.endTimestamp).toBe(now + 25 * 60 * 1000);
    expect(started.prevRemaining).toBe(25 * 60);
    expect(getTimerRemaining(started, now + 11_000)).toBe(25 * 60 - 11);

    const paused = pauseTimer(started, now + 11_000);
    expect(paused).toMatchObject({
      isRunning: false,
      endTimestamp: null,
      prevRemaining: 25 * 60 - 11,
    });
  });

  it("resets back to focus defaults and clears runtime progress", () => {
    const now = 1_700_000_000_000;
    const started = startTimer(createInitialTimerSnapshot(), now);
    const progressed = updateTimerRemaining(started, 1200);
    const reset = resetTimer(progressed);

    expect(reset).toMatchObject({
      stage: TimerStage.Focus,
      isRunning: false,
      endTimestamp: null,
      prevRemaining: 25 * 60,
      stats: {
        focusSec: 0,
        breakSec: 0,
      },
      unsyncedFocusSec: 0,
    });
  });

  it("skips directly to a requested stage and restores that stage duration", () => {
    const skipped = skipToTimerStage(
      createInitialTimerSnapshot(),
      TimerStage.Break
    );

    expect(skipped).toMatchObject({
      stage: TimerStage.Break,
      isRunning: false,
      endTimestamp: null,
      prevRemaining: 5 * 60,
    });
    expect(getNextTimerStage(TimerStage.Break)).toBe(TimerStage.Focus);
  });

  it("updates durations and only rewrites prevRemaining for the idle active stage", () => {
    const idle = updateTimerDurations(createInitialTimerSnapshot(), {
      focus: 30 * 60,
    });
    expect(idle.durations[TimerStage.Focus]).toBe(30 * 60);
    expect(idle.prevRemaining).toBe(30 * 60);

    const running = startTimer(idle, 1_700_000_000_000);
    const updatedWhileRunning = updateTimerDurations(running, {
      focus: 35 * 60,
      break: 10 * 60,
    });

    expect(updatedWhileRunning.durations).toMatchObject({
      [TimerStage.Focus]: 35 * 60,
      [TimerStage.Break]: 10 * 60,
    });
    expect(updatedWhileRunning.prevRemaining).toBe(30 * 60);
  });

  it("accumulates focus progress from decreasing remaining time and ignores backwards ticks", () => {
    const started = startTimer(createInitialTimerSnapshot(), 1_700_000_000_000);
    const progressed = updateTimerRemaining(started, 1490);

    expect(progressed).toMatchObject({
      prevRemaining: 1490,
      stats: {
        focusSec: 10,
        breakSec: 0,
      },
      unsyncedFocusSec: 10,
    });

    const outOfOrder = updateTimerRemaining(progressed, 1495);
    expect(outOfOrder).toMatchObject({
      prevRemaining: 1495,
      stats: {
        focusSec: 10,
        breakSec: 0,
      },
      unsyncedFocusSec: 10,
    });
  });

  it("advances to the next stage only when a matching running stage completes", () => {
    const started = startTimer(createInitialTimerSnapshot(), 1_700_000_000_000);
    const completed = completeTimerStage(started, TimerStage.Focus);

    expect(completed).toMatchObject({
      stage: TimerStage.Break,
      isRunning: false,
      endTimestamp: null,
      prevRemaining: 5 * 60,
    });

    const ignored = completeTimerStage(
      createInitialTimerSnapshot(),
      TimerStage.Break
    );
    expect(ignored).toEqual(createInitialTimerSnapshot());
  });
});
