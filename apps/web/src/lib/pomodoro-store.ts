import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { PomodoroStage, PomodoroState, db } from '@repo/shared';

const broadcastChannel = new BroadcastChannel('meelio:broadcast:pomodoro-sync');

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
      [PomodoroStage.Focus]: 1 * 60,
      [PomodoroStage.Break]: 1 * 30,
    },
    autoStartTimers: true,
    enableSound: false,
    pausedRemaining: null,
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

// /**
//  * Persist state to DB and broadcast to other tabs
//  */
// usePomodoroStore.subscribe(async (state) => {
//   await db.state.put({ ...state, id: 1 });
//   broadcastChannel.postMessage({ type: 'STATE_UPDATE', state });
// });

// /**
//  * Initialize store from DB
//  */
// db.state.get(1).then((savedState) => {
//   if (savedState) {
//     usePomodoroStore.setState(savedState);
//   }
// });