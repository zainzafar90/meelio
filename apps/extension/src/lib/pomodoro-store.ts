import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import {  PomodoroStage, PomodoroState } from '@repo/shared';


export const usePomodoroStore = create(
  persist(
    subscribeWithSelector<PomodoroState>(() => ({
      id: 1,
      stats: {
        todaysFocusSessions: 0,
        todaysBreaks: 0,
        todaysFocusTime: 0,
        todaysBreakTime: 0,
    },
    activeStage: PomodoroStage.Focus,
    isRunning: false,
    endTimestamp: null,
    sessionCount: 0,
    stageDurations: {
      [PomodoroStage.Focus]: 25 * 60,
      [PomodoroStage.Break]: 5 * 60,
    },
    autoStartTimers: true,
    enableSound: false,
    pausedRemaining: null,
    lastUpdated: Date.now()
    })),
    {
      name: 'meelio:local:pomodoro',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      skipHydration: false,
      partialize: (state) => ({
        id: state.id,
        stats: state.stats,
        activeStage: state.activeStage,
        isRunning: state.isRunning,
        autoStartTimers: state.autoStartTimers,
        endTimestamp: state.endTimestamp,
      }),
    }
  )
);

