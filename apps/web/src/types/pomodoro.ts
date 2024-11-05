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

export type PomodoroTimer = {
  activeStage: PomodoroStage;
  running: boolean;
  remaining: number;
  sessionCount: number;
  stageSeconds: {
    [key in PomodoroStage]: number;
  };
  longBreakInterval: number;
  autoStartBreaks: boolean;
  enableSound: boolean;
};

export enum PomodoroStage {
  WorkTime = 0,
  ShortBreak = 1,
  LongBreak = 2,
}

export const PomodoroStageMap = {
  [PomodoroStage.WorkTime]: "Focus",
  [PomodoroStage.ShortBreak]: "Short Break",
  [PomodoroStage.LongBreak]: "Long Break",
};
