import { describe, expect, it } from "vitest";
import { TimerStage } from "@repo/contracts/timer";

import {
  completeTimerStage,
  createInitialTimerSnapshot,
  getNextTimerStage,
  getTimerRemaining,
  pauseTimer,
  resetTimer,
  restoreTimer,
  skipToTimerStage,
  startTimer,
  updateTimerDurations,
  updateTimerRemaining,
} from "./timer.machine";

describe("timer machine", () => {
  it("creates the default timer snapshot", () => {
    const snapshot = createInitialTimerSnapshot();

    expect(snapshot.stage).toBe(TimerStage.Focus);
    expect(snapshot.isRunning).toBe(false);
    expect(snapshot.durations[TimerStage.Focus]).toBe(25 * 60);
    expect(snapshot.durations[TimerStage.Break]).toBe(5 * 60);
    expect(snapshot.settings).toEqual({
      notifications: true,
      sounds: true,
      soundId: "timeout-1-back-chime",
      soundscapes: true,
      autoStartBreaks: true,
    });
  });

  it("computes the next stage", () => {
    expect(getNextTimerStage(TimerStage.Focus)).toBe(TimerStage.Break);
    expect(getNextTimerStage(TimerStage.Break)).toBe(TimerStage.Focus);
  });

  it("starts and pauses a timer using remaining time", () => {
    const initial = createInitialTimerSnapshot({
      prevRemaining: 90,
    });

    const started = startTimer(initial, 1_000);
    expect(started.isRunning).toBe(true);
    expect(started.endTimestamp).toBe(91_000);
    expect(started.prevRemaining).toBe(90);

    const paused = pauseTimer(started, 31_000);
    expect(paused.isRunning).toBe(false);
    expect(paused.endTimestamp).toBeNull();
    expect(paused.prevRemaining).toBe(60);
  });

  it("resets to the selected stage duration and clears stats", () => {
    const initial = createInitialTimerSnapshot({
      stage: TimerStage.Break,
      stats: { focusSec: 30, breakSec: 10 },
      prevRemaining: 15,
      unsyncedFocusSec: 30,
    });

    const reset = resetTimer(initial, TimerStage.Focus);
    expect(reset.stage).toBe(TimerStage.Focus);
    expect(reset.isRunning).toBe(false);
    expect(reset.prevRemaining).toBe(25 * 60);
    expect(reset.stats).toEqual({ focusSec: 0, breakSec: 0 });
    expect(reset.unsyncedFocusSec).toBe(0);
  });

  it("skips directly to a requested stage and restores that stage duration", () => {
    const initial = createInitialTimerSnapshot({
      stage: TimerStage.Focus,
      prevRemaining: 12,
      isRunning: true,
      endTimestamp: 25_000,
    });

    const skipped = skipToTimerStage(initial, TimerStage.Break);
    expect(skipped.stage).toBe(TimerStage.Break);
    expect(skipped.isRunning).toBe(false);
    expect(skipped.endTimestamp).toBeNull();
    expect(skipped.prevRemaining).toBe(5 * 60);
  });

  it("updates stage durations and inactive remaining time", () => {
    const initial = createInitialTimerSnapshot({
      stage: TimerStage.Focus,
      isRunning: false,
      prevRemaining: 25 * 60,
    });

    const updated = updateTimerDurations(initial, { focus: 30 * 60 });
    expect(updated.durations[TimerStage.Focus]).toBe(30 * 60);
    expect(updated.prevRemaining).toBe(30 * 60);
  });

  it("tracks focus and break stats as remaining time drops", () => {
    const focusState = createInitialTimerSnapshot({
      stage: TimerStage.Focus,
      isRunning: true,
      prevRemaining: 60,
    });
    const focusUpdated = updateTimerRemaining(focusState, 45);
    expect(focusUpdated.prevRemaining).toBe(45);
    expect(focusUpdated.stats.focusSec).toBe(15);
    expect(focusUpdated.unsyncedFocusSec).toBe(15);

    const breakState = createInitialTimerSnapshot({
      stage: TimerStage.Break,
      isRunning: true,
      prevRemaining: 50,
    });
    const breakUpdated = updateTimerRemaining(breakState, 40);
    expect(breakUpdated.stats.breakSec).toBe(10);
  });

  it("completes only the active running stage", () => {
    const running = createInitialTimerSnapshot({
      stage: TimerStage.Focus,
      isRunning: true,
      prevRemaining: 1,
    });

    const completed = completeTimerStage(running, TimerStage.Focus);
    expect(completed.stage).toBe(TimerStage.Break);
    expect(completed.isRunning).toBe(false);
    expect(completed.prevRemaining).toBe(5 * 60);

    const idle = createInitialTimerSnapshot();
    expect(completeTimerStage(idle, TimerStage.Focus)).toBe(idle);
  });

  it("restores running timers and stops expired ones", () => {
    const running = createInitialTimerSnapshot({
      isRunning: true,
      endTimestamp: 15_000,
    });
    const restored = restoreTimer(running, 12_000);
    expect(restored.prevRemaining).toBe(3);
    expect(restored.isRunning).toBe(true);

    const expired = restoreTimer(running, 20_000);
    expect(expired.isRunning).toBe(false);
    expect(expired.endTimestamp).toBeNull();
  });

  it("reads remaining time from the most relevant source", () => {
    const idle = createInitialTimerSnapshot();
    expect(getTimerRemaining(idle, 0)).toBe(25 * 60);

    const paused = createInitialTimerSnapshot({ prevRemaining: 42 });
    expect(getTimerRemaining(paused, 0)).toBe(42);

    const running = createInitialTimerSnapshot({
      isRunning: true,
      endTimestamp: 5_500,
    });
    expect(getTimerRemaining(running, 2_000)).toBe(4);
  });
});
