import { PomodoroStage } from "@/types/pomodoro";

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
export const getTime = (
  seconds: number
): [string | null, string | null, string, string] => {
  // Calculate the number of whole minutes and remaining seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Decompose minutes into tens and units
  const minuteTens = Math.floor(minutes / 10).toString();
  const minuteUnits = (minutes % 10).toString();

  // Decompose seconds into tens and units
  const secondTens = Math.floor(remainingSeconds / 10).toString();
  const secondUnits = (remainingSeconds % 10).toString();

  return [minuteTens, minuteUnits, secondTens, secondUnits];
};
