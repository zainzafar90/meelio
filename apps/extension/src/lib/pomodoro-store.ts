import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { PomodoroSession, PomodoroStage, db, getTodaysSummary } from '@repo/shared';

export interface PomodoroState {
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
  autoStartTimers: boolean;
  enableSound: boolean;
  pausedRemaining: number | null;
  lastUpdated: number;
}

export const usePomodoroStore = create(
  subscribeWithSelector<PomodoroState>(() => ({
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
      [PomodoroStage.Focus]: 1 * 10,
      [PomodoroStage.Break]: 1 * 5,
    },
    autoStartTimers: true,
    enableSound: false,
    pausedRemaining: null,
    lastUpdated: Date.now()
  }))
);

// Sync with chrome storage
usePomodoroStore.subscribe((state) => {
  chrome.storage.local.set({ pomodoroState: state });
});

// Initialize from chrome storage
chrome.storage.local.get('pomodoroState').then((result) => {
  if (result.pomodoroState) {
    usePomodoroStore.setState(result.pomodoroState);
  }
});


export function addPomodoroSession(session: PomodoroSession): Promise<number> {
  return db.sessions.add(session);
} 


export async function addPomodoroSummary(duration: number, stage: PomodoroStage): Promise<number> {
  const todaysSummary = await getTodaysSummary();

  if (stage === PomodoroStage.Focus) {
    todaysSummary.focusSessions++;
    todaysSummary.totalFocusTime += duration;
  } else if (stage === PomodoroStage.Break) {
    todaysSummary.breaks++;
    todaysSummary.totalBreakTime += duration;
  }

  return db.dailySummaries.put(todaysSummary);

}