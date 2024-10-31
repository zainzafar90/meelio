import Dexie, { Table } from "dexie";

export interface PomodoroSession {
  id?: number;
  timestamp: number;
  stage: number;
  duration: number;
  completed: boolean;
}

export interface DailySummary {
  id?: number;
  date: string; // YYYY-MM-DD format
  focusSessions: number;
  shortBreaks: number;
  longBreaks: number;
  totalFocusTime: number; // in seconds
}

export class PomodoroDB extends Dexie {
  sessions!: Table<PomodoroSession>;
  dailySummaries!: Table<DailySummary>;

  constructor() {
    super("pomodoro-db");
    this.version(1).stores({
      sessions: "++id, timestamp",
      dailySummaries: "++id, date",
    });
  }
}

export const db = new PomodoroDB();

export const getTodaysSummary = async (): Promise<DailySummary> => {
  const today = new Date().toISOString().split("T")[0];
  const summary = await db.dailySummaries.where("date").equals(today).first();

  if (!summary) {
    return {
      date: today,
      focusSessions: 0,
      shortBreaks: 0,
      longBreaks: 0,
      totalFocusTime: 0,
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
      const summary = await db.dailySummaries
        .where("date")
        .equals(date)
        .first();
      return (
        summary || {
          date,
          focusSessions: 0,
          shortBreaks: 0,
          longBreaks: 0,
          totalFocusTime: 0,
        }
      );
    })
  );

  return summaries;
};
