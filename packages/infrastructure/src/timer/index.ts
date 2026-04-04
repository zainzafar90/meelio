import { TimerStage } from "@repo/timer-core";

import { pomodoroSounds } from "../../../../packages/shared/src/data/sounds-data";
import {
  addSimpleTimerBreakTime,
  addSimpleTimerFocusTime,
} from "../../../../packages/shared/src/lib/db/pomodoro.dexie";
import { soundSyncService } from "../../../../packages/shared/src/services/sound-sync.service";
import { timerEvents } from "../../../../packages/shared/src/utils/timer-events";
import type { TimerAppEvent } from "@repo/application/timer";

export const playTimerCompletionSound = async (
  soundEnabled: boolean,
  soundId = "timeout-1-back-chime"
) => {
  if (!soundEnabled) {
    return;
  }

  const sound = pomodoroSounds.find((entry) => entry.id === soundId);
  if (!sound) {
    return;
  }

  const url = await soundSyncService.getSoundUrl(sound.url);
  const audio = new Audio(url);
  audio.volume = 0.5;
  await audio.play();
};

export const recordCompletedTimerStage = async (
  stage: TimerStage,
  duration: number
) => {
  if (stage === TimerStage.Focus) {
    await addSimpleTimerFocusTime(duration);
    return;
  }

  await addSimpleTimerBreakTime(duration);
};

export const emitTimerAppEvent = (event: TimerAppEvent): void => {
  timerEvents.emit(event);
};
