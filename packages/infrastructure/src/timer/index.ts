import { TimerStage } from "@repo/contracts/timer";
import type { TimerAppEvent } from "@repo/application/timer";

import {
  addSimpleTimerBreakTime,
  addSimpleTimerFocusTime,
} from "../db/pomodoro.dexie";
import { pomodoroSounds } from "./pomodoro-sounds";
import { timerEvents } from "./timer-events";

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

  const audio = new Audio(sound.url);
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

export { timerEvents } from "./timer-events";
