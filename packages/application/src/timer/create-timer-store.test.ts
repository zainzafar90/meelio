import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimerStage } from "@repo/contracts/timer";
import type { TimerEvent, TimerMessage } from "@repo/contracts/timer";

import { createTimerStore, type TimerAppEvent } from "./create-timer-store";

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
};

describe("createTimerStore", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("starts the timer through the runtime and emits a start event", () => {
    const sendMessage = vi.fn<(message: TimerMessage) => void>();
    const emitted: TimerAppEvent[] = [];
    const runtime = {
      sendMessage,
      subscribe: (_callback: (message: TimerEvent) => void) => () => {},
      showNotification: vi.fn(),
    };

    const store = createTimerStore(runtime, {
      now: () => 1_700_000_000_000,
      storage: createMemoryStorage(),
      playCompletionSound: vi.fn().mockResolvedValue(undefined),
      recordCompletedStage: vi.fn().mockResolvedValue(undefined),
      emitEvent: (event) => emitted.push(event),
    });

    store.getState().start();

    expect(sendMessage).toHaveBeenCalledWith({
      type: "START",
      duration: store.getState().durations[TimerStage.Focus],
      stage: TimerStage.Focus,
    });
    expect(emitted).toContainEqual(
      expect.objectContaining({
        type: "timer:start",
        stage: "focus",
      })
    );
  });

  it("records stage completion and emits timer completion events", () => {
    const recordCompletedStage = vi.fn().mockResolvedValue(undefined);
    const playCompletionSound = vi.fn().mockResolvedValue(undefined);
    const emitted: TimerAppEvent[] = [];
    const runtime = {
      sendMessage: vi.fn(),
      subscribe: (_callback: (message: TimerEvent) => void) => () => {},
      showNotification: vi.fn(),
    };

    const store = createTimerStore(runtime, {
      now: () => 1_700_000_000_000,
      storage: createMemoryStorage(),
      playCompletionSound,
      recordCompletedStage,
      emitEvent: (event) => emitted.push(event),
    });

    store.setState({
      ...store.getState(),
      isRunning: true,
      stage: TimerStage.Focus,
      endTimestamp: 1_700_000_030_000,
    });

    store.getState().completeStage();

    expect(recordCompletedStage).toHaveBeenCalledWith(
      TimerStage.Focus,
      store.getState().durations[TimerStage.Focus]
    );
    expect(playCompletionSound).toHaveBeenCalled();
    expect(emitted).toContainEqual(
      expect.objectContaining({
        type: "timer:complete",
        stage: "focus",
      })
    );
  });
});
