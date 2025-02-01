import { PomodoroStage } from "../types";

/*
|--------------------------------------------------------------------------
| Next Stage for Pomodoro
|--------------------------------------------------------------------------
|
| These functions calculate the next stage of the pomodoro timer. They are
| used to display the next stage of the pomodoro timer. 
|
*/
export const getNextStage = (
  activeStage: PomodoroStage,
  sessionCount: number,
  longBreakInterval: number
) => {
  if (activeStage === PomodoroStage.WorkTime) {
    const isLongBreakDue =
      sessionCount > 0 && sessionCount % longBreakInterval === 0;
    return isLongBreakDue ? PomodoroStage.LongBreak : PomodoroStage.ShortBreak;
  } else {
    return PomodoroStage.WorkTime;
  }
};

/*
|--------------------------------------------------------------------------
| Get Session Count
|--------------------------------------------------------------------------
|
| These functions calculate the next session count of the pomodoro timer. They are
| used to display the next session count of the pomodoro timer.
|
*/
export const getSessionCount = (
  activeStage: PomodoroStage,
  sessionCount: number
) => {
  let newSessionCount = sessionCount;

  if (activeStage === PomodoroStage.WorkTime) {
    newSessionCount++;
  }
  return newSessionCount;
};

/*
|--------------------------------------------------------------------------
| Get Time
|-------------------------------------------------------------------------
| 
| These functions calculate the time for the pomodoro timer. They are used
| to display the time for the pomodoro timer. Seconds are decomposed into
| tens and units for minutes and seconds.
|
| Example: 150 seconds = returns [0,2,3,0] = 2 minutes, 30 seconds
|
| @returns [minuteTens, minuteUnits, secondTens, secondUnits]
|
*/
export const getTime = (seconds: number): [number, number, number, number] => {
  // Calculate the number of whole minutes and remaining seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Decompose minutes into tens and units
  const minuteTens = Math.floor(minutes / 10);
  const minuteUnits = minutes % 10;

  // Decompose seconds into tens and units
  const secondTens = Math.floor(remainingSeconds / 10);
  const secondUnits = remainingSeconds % 10;

  return [minuteTens, minuteUnits, secondTens, secondUnits];
};

/*
|--------------------------------------------------------------------------
| Format Time
|--------------------------------------------------------------------------
|
| These functions format the time for the pomodoro timer. They are used
| to display the time for the pomodoro timer.
|
| @param seconds - The time in seconds
| @returns The time in minutes and seconds
|
*/
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
