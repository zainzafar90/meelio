import { createTimerStore } from "@repo/application/timer";
import {
  emitTimerAppEvent,
  playTimerCompletionSound,
  recordCompletedTimerStage,
} from "@repo/infrastructure/timer";
import { createExtensionTimerRuntime } from "@repo/platform/extension/timer";

import {
  hasNotificationPermission,
  requestNotificationPermission as requestExtensionNotificationPermission,
} from "../utils/extension-permissions";

export const extensionTimerRuntime = createExtensionTimerRuntime({
  hasNotificationPermission,
  requestNotificationPermission: requestExtensionNotificationPermission,
});

export const extensionTimerStore = createTimerStore(extensionTimerRuntime, {
  now: () => Date.now(),
  storage: localStorage,
  playCompletionSound: playTimerCompletionSound,
  recordCompletedStage: recordCompletedTimerStage,
  emitEvent: emitTimerAppEvent,
});
