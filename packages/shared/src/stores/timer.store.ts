import { createTimerStore as createApplicationTimerStore } from "@repo/application/timer";
import {
  emitTimerAppEvent,
  playTimerCompletionSound,
  recordCompletedTimerStage,
} from "@repo/infrastructure/timer";
import type { TimerRuntimeAdapter } from "@repo/contracts/timer";

// Compatibility wrapper for older shared consumers. Timer behavior now lives in
// the layered application and infrastructure packages.
export const createTimerStore = (runtime: TimerRuntimeAdapter) =>
  createApplicationTimerStore(runtime, {
    now: () => Date.now(),
    storage: localStorage,
    playCompletionSound: playTimerCompletionSound,
    recordCompletedStage: recordCompletedTimerStage,
    emitEvent: emitTimerAppEvent,
  });
