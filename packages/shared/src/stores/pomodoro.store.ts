import { createWithEqualityFn as create } from "zustand/traditional";

import { PomodoroStage, PomodoroTimer } from "../types";
import { db } from "../lib/db/meelio.dexie";
import { getTodaysSummary } from "../lib/db/pomodoro.dexie";
import { MINUTE_IN_SECONDS } from "../utils/common.utils";

type PomodoroStore = {
  timer: PomodoroTimer;
  stats: {
    todaysFocusSessions: number;
    todaysBreaks: number;
    todaysFocusTime: number;
    todaysBreakTime: number;
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
    activeStage: PomodoroStage.Focus,
    running: false,
    remaining: 25 * MINUTE_IN_SECONDS,
    sessionCount: 0,
    stageSeconds: {
      [PomodoroStage.Focus]: 25 * MINUTE_IN_SECONDS,
      [PomodoroStage.Break]: 5 * MINUTE_IN_SECONDS,
    },
    autoStartBreaks: true,
    enableSound: true,
  },
  stats: {
    todaysFocusSessions: 0,
    todaysBreaks: 0,
    todaysFocusTime: 0,
    todaysBreakTime: 0,
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
        activeStage: PomodoroStage.Focus,
        remaining: state.timer.stageSeconds[PomodoroStage.Focus],
        sessionCount: 0,
      },
    })),

  updateTimer: (remaining: number) =>
    set((state) => {
      return { timer: { ...state.timer, remaining } };
    }),

  advanceTimer: () =>
    set((state) => {
      const { activeStage, stageSeconds, sessionCount, autoStartBreaks } =
        state.timer;
      let nextStage: PomodoroStage;
      let newSessionCount = sessionCount;

      if (activeStage === PomodoroStage.Focus) {
        newSessionCount++;
        nextStage =
          newSessionCount % 2 === 0 ? PomodoroStage.Break : PomodoroStage.Focus;
      } else {
        nextStage = PomodoroStage.Focus;
      }

      return {
        timer: {
          ...state.timer,
          activeStage: nextStage,
          remaining: stageSeconds[nextStage],
          running: autoStartBreaks || nextStage === PomodoroStage.Focus,
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

    await db.focusSessions.add(session);

    const summary = await getTodaysSummary();

    if (timer.activeStage === PomodoroStage.Focus) {
      summary.focusSessions++;
      summary.totalFocusTime += timer.stageSeconds[timer.activeStage];
    } else if (timer.activeStage === PomodoroStage.Break) {
      summary.breaks++;
      summary.totalBreakTime += timer.stageSeconds[timer.activeStage];
    }

    await db.focusStats.put(summary);

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
        todaysBreaks: summary.breaks,
        todaysFocusTime: summary.totalFocusTime,
        todaysBreakTime: summary.totalBreakTime,
      },
    });
  },
}));
