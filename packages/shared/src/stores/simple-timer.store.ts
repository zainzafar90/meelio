import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './auth.store';
import {
  TimerStage,
  TimerState,
  TimerDeps,
  TimerSettings,
} from '../types/new/pomodoro-lite';

function initState(): Omit<
  TimerState,
  | keyof TimerDeps
  | 'start'
  | 'pause'
  | 'reset'
  | 'skipToStage'
  | 'updateDurations'
  | 'toggleNotifications'
  | 'toggleSounds'
  | 'updateRemaining'
  | 'getLimitStatus'
  | 'sync'
  | 'restore'
> {
  return {
    stage: TimerStage.Focus,
    isRunning: false,
    endTimestamp: null,
    durations: { [TimerStage.Focus]: 25 * 60, [TimerStage.Break]: 5 * 60 },
    settings: { notifications: false, sounds: false },
    stats: { focusSec: 0, breakSec: 0 },
    dailyLimitSec: 90 * 60,
    unsyncedFocusSec: 0,
    prevRemaining: null,
  };
}

export const createTimerStore = (deps: TimerDeps) =>
  create<TimerState>()(
    persist(
      (set, get) => {
        const start = () => {
          const duration = get().durations[get().stage];
          const end = deps.now() + duration * 1000;
          set({ isRunning: true, endTimestamp: end, prevRemaining: duration });
        };

        const pause = () => {
          set({ isRunning: false, endTimestamp: null, prevRemaining: null });
        };

        const reset = () => {
          const duration = get().durations[TimerStage.Focus];
          set({
            stage: TimerStage.Focus,
            isRunning: false,
            endTimestamp: null,
            stats: { focusSec: 0, breakSec: 0 },
            unsyncedFocusSec: 0,
            prevRemaining: duration,
          });
        };

        const skipToStage = (stage: TimerStage) => {
          const duration = get().durations[stage];
          set({ stage, isRunning: false, endTimestamp: null, prevRemaining: duration });
        };

        const updateDurations = (d: Partial<{ focus: number; break: number }>) => {
          set((s) => ({
            durations: {
              [TimerStage.Focus]: d.focus ?? s.durations[TimerStage.Focus],
              [TimerStage.Break]: d.break ?? s.durations[TimerStage.Break],
            },
          }));
        };

        const toggleNotifications = () => {
          set((s) => ({ settings: { ...s.settings, notifications: !s.settings.notifications } }));
        };

        const toggleSounds = () => {
          set((s) => ({ settings: { ...s.settings, sounds: !s.settings.sounds } }));
        };

        const updateRemaining = (remaining: number) => {
          const s = get();
          if (s.prevRemaining !== null && s.isRunning) {
            const diff = s.prevRemaining - remaining;
            if (s.stage === TimerStage.Focus) {
              const focus = s.stats.focusSec + diff;
              const unsynced = s.unsyncedFocusSec + diff;
              set({
                stats: { ...s.stats, focusSec: focus },
                unsyncedFocusSec: unsynced,
                prevRemaining: remaining,
              });
              if (unsynced >= 300) {
                deps.pushUsage(unsynced).catch(() => {});
                set({ unsyncedFocusSec: 0 });
              }
            } else {
              set({
                stats: { ...s.stats, breakSec: s.stats.breakSec + diff },
                prevRemaining: remaining,
              });
            }
          } else {
            set({ prevRemaining: remaining });
          }
        };

        const getLimitStatus = () => {
          const auth = useAuthStore.getState();
          const isPro = !!auth.user?.isPro;
          const limit = isPro ? Infinity : get().dailyLimitSec;
          const used = get().stats.focusSec;
          return { isLimitReached: used >= limit, remainingSec: Math.max(0, limit - used) };
        };

        const sync = async () => {
          const auth = useAuthStore.getState();
          if (!auth.user?.isPro) return;
          const settings = get().settings;
          try {
            await deps.pushSettings(settings);
          } catch {
            // ignore
          }
        };

        const restore = () => {
          const s = get();
          if (!s.isRunning || !s.endTimestamp) return;
          const left = Math.ceil((s.endTimestamp - deps.now()) / 1000);
          if (left <= 0) {
            set({ isRunning: false, endTimestamp: null });
          } else {
            set({ prevRemaining: left });
          }
        };

        return {
          ...initState(),
          start,
          pause,
          reset,
          skipToStage,
          updateDurations,
          toggleNotifications,
          toggleSounds,
          updateRemaining,
          getLimitStatus,
          sync,
          restore,
        } as TimerState;
      },
      {
        name: 'meelio:simple-timer',
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({
          stage: s.stage,
          durations: s.durations,
          settings: s.settings,
          stats: s.stats,
          isRunning: s.isRunning,
          endTimestamp: s.endTimestamp,
          prevRemaining: s.prevRemaining,
        }),
      }
    )
  );

export const useTimerStore = createTimerStore({
  now: () => Date.now(),
  pushUsage: async () => Promise.resolve(),
  pushSettings: async (_: TimerSettings) => Promise.resolve(),
});
