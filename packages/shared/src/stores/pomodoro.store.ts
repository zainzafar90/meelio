import { create } from "zustand";

import { PomodoroStage, PomodoroTimer } from "../types";
import { db, getTodaysSummary } from "../lib/db/pomodoro-db";
import { MINUTE_IN_SECONDS } from "../utils/common.utils";

type PomodoroStore = {
  timer: PomodoroTimer;
  stats: {
    todaysFocusSessions: number;
    todaysShortBreaks: number;
    todaysLongBreaks: number;
    todaysFocusTime: number;
  };
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  updateTimer: (remaining: number) => void;
  advanceTimer: () => void;
  changeStage: (stage: PomodoroStage) => void;
  changeTimerSettings: (stage: PomodoroStage, minutes: number) => void;
  sessionCompleted: () => void;
  toggleAutoStartBreaks: () => void;
  setTimerDuration: (duration: number) => void;
  toggleTimerSound: () => void;
  isTimerRunning: () => boolean;
  completeSession: () => Promise<void>;
  loadTodayStats: () => Promise<void>;
};

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  timer: {
    activeStage: PomodoroStage.WorkTime,
    running: false,
    remaining: 25 * MINUTE_IN_SECONDS,
    sessionCount: 0,
    stageSeconds: {
      [PomodoroStage.WorkTime]: 25 * MINUTE_IN_SECONDS,
      [PomodoroStage.ShortBreak]: 5 * MINUTE_IN_SECONDS,
      [PomodoroStage.LongBreak]: 15 * MINUTE_IN_SECONDS,
    },
    longBreakInterval: 4,
    autoStartBreaks: true,
    enableSound: true,
  },
  stats: {
    todaysFocusSessions: 0,
    todaysShortBreaks: 0,
    todaysLongBreaks: 0,
    todaysFocusTime: 0,
  },
  startTimer: () =>
    set((state) => {
      return { timer: { ...state.timer, running: true } };
    }),

  pauseTimer: () =>
    set((state) => {
      return { timer: { ...state.timer, running: false } };
    }),

  resumeTimer: () =>
    set((state) => {
      return { timer: { ...state.timer, running: true } };
    }),

  resetTimer: () =>
    set((state) => ({
      timer: {
        ...state.timer,
        running: false,
        activeStage: PomodoroStage.WorkTime,
        remaining: state.timer.stageSeconds[PomodoroStage.WorkTime],
        sessionCount: 0,
      },
    })),

  updateTimer: (remaining: number) =>
    set((state) => {
      return { timer: { ...state.timer, remaining } };
    }),

  advanceTimer: () =>
    set((state) => {
      const {
        activeStage,
        stageSeconds,
        sessionCount,
        longBreakInterval,
        autoStartBreaks,
      } = state.timer;
      let nextStage: PomodoroStage;
      let newSessionCount = sessionCount;

      if (activeStage === PomodoroStage.WorkTime) {
        newSessionCount++;
        nextStage =
          newSessionCount % longBreakInterval === 0
            ? PomodoroStage.LongBreak
            : PomodoroStage.ShortBreak;
      } else {
        nextStage = PomodoroStage.WorkTime;
      }

      return {
        timer: {
          ...state.timer,
          activeStage: nextStage,
          remaining: stageSeconds[nextStage],
          running: autoStartBreaks || nextStage === PomodoroStage.WorkTime,
          sessionCount: newSessionCount,
        },
      };
    }),

  changeStage: (stage: PomodoroStage) =>
    set((state) => ({
      timer: {
        ...state.timer,
        activeStage: stage,
        remaining: state.timer.stageSeconds[stage],
        running: false,
      },
    })),

  changeTimerSettings: (stage: PomodoroStage, minutes: number) =>
    set((state) => ({
      timer: {
        ...state.timer,
        stageSeconds: {
          ...state.timer.stageSeconds,
          [stage]: minutes * MINUTE_IN_SECONDS,
        },
      },
    })),

  sessionCompleted: () =>
    set((state) => ({
      timer: {
        ...state.timer,
        sessionCount: 0,
        running: false,
      },
    })),

  toggleAutoStartBreaks: () =>
    set((state) => ({
      timer: {
        ...state.timer,
        autoStartBreaks: !state.timer.autoStartBreaks,
      },
    })),

  setTimerDuration: (duration: number) =>
    set((state) => ({
      timer: {
        ...state.timer,
        remaining: duration,
      },
    })),

  toggleTimerSound: () =>
    set((state) => ({
      timer: {
        ...state.timer,
        enableSound: !state.timer.enableSound,
      },
    })),

  isTimerRunning: () => get().timer.running,

  completeSession: async () => {
    const { timer } = get();
    const session = {
      timestamp: Date.now(),
      stage: timer.activeStage,
      duration: timer.stageSeconds[timer.activeStage],
      completed: true,
    };

    await db.sessions.add(session);

    const summary = await getTodaysSummary();

    if (timer.activeStage === PomodoroStage.WorkTime) {
      summary.focusSessions++;
      summary.totalFocusTime += timer.stageSeconds[timer.activeStage];
    } else if (timer.activeStage === PomodoroStage.ShortBreak) {
      summary.shortBreaks++;
    } else {
      summary.longBreaks++;
    }

    await db.dailySummaries.put(summary);

    await get().loadTodayStats();
  },

  loadTodayStats: async () => {
    const summary = await getTodaysSummary();
    set({
      timer: {
        ...get().timer,
        sessionCount: summary.focusSessions,
      },
      stats: {
        todaysFocusSessions: summary.focusSessions,
        todaysShortBreaks: summary.shortBreaks,
        todaysLongBreaks: summary.longBreaks,
        todaysFocusTime: summary.totalFocusTime,
      },
    });
  },
}));
