import { createTimerStore } from "@repo/application/timer";
import {
  emitTimerAppEvent,
  playTimerCompletionSound,
  recordCompletedTimerStage,
} from "@repo/infrastructure/timer";
import { createWebTimerRuntime } from "@repo/platform/web/timer";

import TimerWorker from "../workers/timer-worker?worker";

export const webTimerRuntime = createWebTimerRuntime(TimerWorker);

export const webTimerStore = createTimerStore(webTimerRuntime, {
  now: () => Date.now(),
  storage: localStorage,
  playCompletionSound: playTimerCompletionSound,
  recordCompletedStage: recordCompletedTimerStage,
  emitEvent: emitTimerAppEvent,
});
