import { Timer } from "@repo/shared";

import { webTimerRuntime, webTimerStore } from "../stores/web.timer.store";

export const WebTimer = () => {
  return <Timer timerStore={webTimerStore} runtime={webTimerRuntime} />;
};
