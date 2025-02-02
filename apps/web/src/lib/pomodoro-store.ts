import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import Dexie from 'dexie';
import { PomodoroStage } from '@repo/shared';

export interface PomodoroState {
  id: number;
  stats: {
    todaysFocusSessions: number;
    todaysShortBreaks: number;
    todaysLongBreaks: number;
    todaysFocusTime: number;
  };
  activeStage: PomodoroStage;
  isRunning: boolean;
  startTimestamp: number | null;
  sessionCount: number;
  stageDurations: {
    [key in PomodoroStage]: number;
  };
  longBreakInterval: number;
  lastUpdated: number;
  autoStartTimers: boolean;
  enableSound: boolean;
}

class PomodoroDB extends Dexie {
  state!: Dexie.Table<PomodoroState, number>;
  
  constructor() {
    super('meelio:pomodoro');
    this.version(1).stores({
      state: '++id,lastUpdated'
    });
  }
}

const db = new PomodoroDB();
const broadcastChannel = new BroadcastChannel('pomodoro-sync');

export const usePomodoroStore = create(
  subscribeWithSelector<PomodoroState>(() => ({
    id: 1,
    stats: {
      todaysFocusSessions: 0,
      todaysShortBreaks: 0,
      todaysLongBreaks: 0,
      todaysFocusTime: 0
    },
    activeStage: PomodoroStage.WorkTime,
    isRunning: false,
    startTimestamp: null,
    sessionCount: 0,
    stageDurations: {
      [PomodoroStage.WorkTime]: 25 * 60,
      [PomodoroStage.ShortBreak]: 5 * 60,
      [PomodoroStage.LongBreak]: 15 * 60
    },
    longBreakInterval: 4,
    autoStartTimers: true,
    enableSound: false,
    lastUpdated: Date.now()
  }))
);

// Sync between tabs
broadcastChannel.onmessage = async (event) => {
  if (event.data.type === 'STATE_UPDATE') {
    const remoteState = event.data.state;
    const localState = usePomodoroStore.getState();

    if (remoteState.lastUpdated > localState.lastUpdated) {
      usePomodoroStore.setState(remoteState);
    }
  }
};

/**
 * Persist state to DB and broadcast to other tabs
 */
usePomodoroStore.subscribe(async (state) => {
  await db.state.put({ ...state, id: 1 });
  broadcastChannel.postMessage({ type: 'STATE_UPDATE', state });
});

/**
 * Initialize store from DB
 */
db.state.get(1).then((savedState) => {
  if (savedState) usePomodoroStore.setState(savedState);
});