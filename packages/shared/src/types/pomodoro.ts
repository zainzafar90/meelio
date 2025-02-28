/*
|-----------------------------------------------------------------------------------|
| Timer holds the following properties:
|
| - running: a boolean value determining whether the timer is running or not
| - remaining: the remaining time of the timer in seconds
| - sessionCount: the number of sessions completed
| - stageSeconds: an array of the number of seconds for each stage
| - activeStage: the current stage of the timer
| - autoStartBreaks: a boolean value determining whether breaks should be auto-started
| - longBreakInterval: the number of sessions before a long break
| - enableSound: a boolean value determining whether the sound should be enabled or not
|
|-----------------------------------------------------------------------------------|
*/

import { t } from "i18next";

export type PomodoroTimer = {
  activeStage: PomodoroStage;
  running: boolean;
  remaining: number;
  sessionCount: number;
  stageSeconds: {
    [key in PomodoroStage]: number;
  };
  autoStartBreaks: boolean;
  enableSound: boolean;
};

export enum PomodoroStage {
  Focus = 0,
  Break = 1,
}

export const PomodoroStageMap = {
  [PomodoroStage.Focus]: t("timer.stages.focus"),
  [PomodoroStage.Break]: t("timer.stages.shortBreak"),
};

export interface PomodoroState {
  id: number;
  stats: {
    todaysFocusSessions: number;
    todaysBreaks: number;
    todaysFocusTime: number;
    todaysBreakTime: number;
  };
  activeStage: PomodoroStage;
  isRunning: boolean;
  endTimestamp: number | null;
  sessionCount: number;
  stageDurations: {
    [key in PomodoroStage]: number;
  };
  lastUpdated: number;
  autoStartTimers: boolean;
  enableSound: boolean;
  pausedRemaining: number | null;
}
