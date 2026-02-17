import { Timer } from "@repo/shared";

import {
  extensionTimerRuntime,
  extensionTimerStore,
} from "../stores/extension.timer.store";

export const ExtensionTimer = () => {
  return <Timer timerStore={extensionTimerStore} runtime={extensionTimerRuntime} />;
};
