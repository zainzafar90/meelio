import { TimerStage } from "../../types/new/pomodoro-lite";
import { db } from "./meelio.dexie";
import { PomodoroSession, DailySummary } from "./models.dexie";
import { IndexableType } from "dexie";

export const getTodaysSummary = async (): Promise<DailySummary> => {
  const today = new Date().toISOString().split("T")[0];
  const summary = await db.focusStats.where("date").equals(today).first();

  if (!summary) {
    return {
      date: today,
      focusSessions: 0,
      breaks: 0,
      totalFocusTime: 0,
      totalBreakTime: 0,
    };
  }

  return summary;
};

export const getWeeklySummary = async (): Promise<DailySummary[]> => {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date.toISOString().split("T")[0];
  }).reverse();

  const summaries = await Promise.all(
    dates.map(async (date) => {
      const summary = await db.focusStats.where("date").equals(date).first();
      return (
        summary || {
          date,
          focusSessions: 0,
          breaks: 0,
          totalFocusTime: 0,
          totalBreakTime: 0,
        }
      );
    })
  );

  return summaries;
};

export const addPomodoroSession = async (
  session: PomodoroSession
): Promise<IndexableType> => {
  return db.focusSessions.add(session);
};

export const addPomodoroSummary = async (
  duration: number,
  stage: TimerStage
): Promise<IndexableType> => {
  const todaysSummary = await getTodaysSummary();

  if (stage === TimerStage.Focus) {
    todaysSummary.focusSessions++;
    todaysSummary.totalFocusTime += duration;
  } else if (stage === TimerStage.Break) {
    todaysSummary.breaks++;
    todaysSummary.totalBreakTime += duration;
  }

  return db.focusStats.put(todaysSummary);
};

export const addFocusTimeMinute = async (): Promise<IndexableType> => {
  const todaysSummary = await getTodaysSummary();

  todaysSummary.totalFocusTime += 60;

  return db.focusStats.put(todaysSummary);
};

export const addSimpleTimerFocusTime = async (seconds: number): Promise<IndexableType> => {
  const todaysSummary = await getTodaysSummary();

  todaysSummary.totalFocusTime += seconds;

  return db.focusStats.put(todaysSummary);
};

export const addSimpleTimerBreakTime = async (seconds: number): Promise<IndexableType> => {
  const todaysSummary = await getTodaysSummary();

  todaysSummary.totalBreakTime += seconds;

  return db.focusStats.put(todaysSummary);
};
