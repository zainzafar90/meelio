import Dexie, { Table } from "dexie";
import { PomodoroStage } from "../../types/pomodoro";

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
  breaks: number;
  totalFocusTime: number; // in seconds
  totalBreakTime: number; // in seconds
}

export class PomodoroDB extends Dexie {
  state!: Table<PomodoroState, number>;
  sessions!: Table<PomodoroSession>;
  dailySummaries!: Table<DailySummary>;

  constructor() {
    super("meelio:pomodoro");
    this.version(1).stores({
      state: "++id, lastUpdated",
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
      const summary = await db.dailySummaries
        .where("date")
        .equals(date)
        .first();
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
): Promise<number> => {
  return db.sessions.add(session);
};

export const addPomodoroSummary = async (
  duration: number,
  stage: PomodoroStage
): Promise<number> => {
  const todaysSummary = await getTodaysSummary();

  if (stage === PomodoroStage.Focus) {
    todaysSummary.focusSessions++;
    todaysSummary.totalFocusTime += duration;
  } else if (stage === PomodoroStage.Break) {
    todaysSummary.breaks++;
    todaysSummary.totalBreakTime += duration;
  }

  return db.dailySummaries.put(todaysSummary);
};
