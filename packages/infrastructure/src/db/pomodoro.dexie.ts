import { IndexableType } from "dexie";

import { TimerStage } from "@repo/contracts/timer";

import { db } from "./meelio.dexie";
import { DailySummary, PomodoroSession } from "./models.dexie";

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
): Promise<IndexableType> => db.focusSessions.add(session);

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

export const addSimpleTimerFocusTime = async (
  seconds: number
): Promise<IndexableType> => {
  const todaysSummary = await getTodaysSummary();
  todaysSummary.totalFocusTime += seconds;
  return db.focusStats.put(todaysSummary);
};

export const addSimpleTimerBreakTime = async (
  seconds: number
): Promise<IndexableType> => {
  const todaysSummary = await getTodaysSummary();
  todaysSummary.totalBreakTime += seconds;
  return db.focusStats.put(todaysSummary);
};

export const isFocusStatsEmpty = async (): Promise<boolean> => {
  const count = await db.focusStats.count();
  return count === 0;
};

export const backfillDailySummariesFromSessions = async (): Promise<void> => {
  const sessions = await db.focusSessions.toArray();
  if (!sessions.length) return;

  const byDate = new Map<string, DailySummary>();
  for (const session of sessions) {
    const dateStr = new Date(session.timestamp).toISOString().split("T")[0];
    let day = byDate.get(dateStr);
    if (!day) {
      day = {
        date: dateStr,
        focusSessions: 0,
        breaks: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
      };
      byDate.set(dateStr, day);
    }
    const isFocus = session.stage === TimerStage.Focus;
    if (isFocus) {
      day.focusSessions += 1;
      day.totalFocusTime += session.duration;
    } else {
      day.breaks += 1;
      day.totalBreakTime += session.duration;
    }
  }

  for (const summary of byDate.values()) {
    await db.focusStats.put(summary);
  }
};
