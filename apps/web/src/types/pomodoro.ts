/*
|-----------------------------------------------------------------------------------|
| Timer holds the following properties:
|
| - running: a boolean value determining whether the timer is running or not
| - remaining: the remaining time of the timer in seconds
| - paused: a boolean value determining whether the timer is paused or not
| - sessionCount: the number of sessions completed
| - stageSeconds: an array of the number of seconds for each stage
| - activeStage: the current stage of the timer
| - autoStartBreaks: a boolean value determining whether breaks should be auto-started
| - longBreakInterval: the number of sessions before a long break
| - completed: a boolean value determining whether all sessions for the pomodoro timer has completed or not
| - enableSound: a boolean value determining whether the sound should be enabled or not
|
|-----------------------------------------------------------------------------------|
*/

export type PomodoroTimer = {
  running: boolean;
  remaining: number;
  sessionCount: number;
  stageSeconds: Record<PomodoroStage, number>;
  activeStage: PomodoroStage;
  autoStartBreaks: boolean;
  longBreakInterval: number;
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
