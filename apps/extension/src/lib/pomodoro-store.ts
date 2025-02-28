import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {  PomodoroStage, PomodoroState } from '@repo/shared';


export const usePomodoroStore = create(
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
  }))
);

// // Sync with chrome storage
// usePomodoroStore.subscribe((state) => {
//   chrome.storage.local.set({ pomodoroState: state });
// });

// // Initialize from chrome storage
// chrome.storage.local.get('pomodoroState').then((result) => {
//   if (result.pomodoroState) {
//     usePomodoroStore.setState(result.pomodoroState);
//   }
// });

