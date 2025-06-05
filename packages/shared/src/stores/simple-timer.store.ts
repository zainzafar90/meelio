import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
} from "../types/new/pomodoro-lite";
    | keyof TimerDeps
    | "start"
    | "pause"
    | "reset"
    | "skipToStage"
    | "updateDurations"
    | "toggleNotifications"
    | "toggleSounds"
    | "updateRemaining"
    | "getLimitStatus"
    | "sync"
    | "restore"
  > {}

function initState(): StoredTimerState {
/** Build a Zustand store for a simple Pomodoro timer. */
        const computeRemainingSec = (
          timestamp: number | null,
          fallback: number,
        ) => {
          if (!timestamp) return fallback;
          const diff = Math.ceil((timestamp - deps.now()) / 1000);
          return Math.max(0, diff);
        };

          const { stage, durations, prevRemaining } = get();
          const remainingSec = prevRemaining ?? durations[stage];
          const end = deps.now() + remainingSec * 1000;
          deps.postMessage?.({ type: "START", duration: remainingSec });
            prevRemaining: remainingSec,
          const { stage, endTimestamp, prevRemaining, durations } = get();
          const remainingSec = computeRemainingSec(
            endTimestamp,
            prevRemaining ?? durations[stage],
          );
          deps.postMessage?.({ type: "PAUSE" });
            prevRemaining: remainingSec,
          deps.postMessage?.({ type: "RESET" });
          deps.postMessage?.({ type: "SKIP_TO_NEXT_STAGE" });
          set({
            stage,
            isRunning: false,
            endTimestamp: null,
            prevRemaining: duration,
          });
        const updateDurations = (
          d: Partial<{ focus: number; break: number }>,
        ) => {
            const patch: Partial<StoredTimerState> = {
              durations: nextDurations,
            };
            deps.postMessage?.({
              type: "UPDATE_DURATION",
              duration: d[current.stage]!,
            });
          set((s) => ({
            settings: {
              ...s.settings,
              notifications: !s.settings.notifications,
            },
          }));
          set((s) => ({
            settings: { ...s.settings, sounds: !s.settings.sounds },
          }));
        const pushUsageIfNeeded = async (focusSec: number) => {
          if (focusSec < 300) return;
          try {
            await deps.pushUsage(focusSec);
            set({ unsyncedFocusSec: 0 });
          } catch (error) {
            console.error("sync usage failed", error);
          }
        };

        const applyStageDiff = (diff: number, stage: TimerStage) => {
          if (stage === TimerStage.Focus) {
            const { stats, unsyncedFocusSec } = get();
            const focus = stats.focusSec + diff;
            const unsynced = unsyncedFocusSec + diff;
            set({
              stats: { ...stats, focusSec: focus },
              unsyncedFocusSec: unsynced,
            });
            void pushUsageIfNeeded(unsynced);
            const { stats } = get();
            set({ stats: { ...stats, breakSec: stats.breakSec + diff } });
          }
        };

        const updateRemaining = (remaining: number) => {
          const { isRunning, prevRemaining, stage } = get();
          if (prevRemaining === null || !isRunning) {
            return;
          const diff = prevRemaining - remaining;
          applyStageDiff(diff, stage);
          set({ prevRemaining: remaining });
          return {
            isLimitReached: used >= limit,
            remainingSec: Math.max(0, limit - used),
          };
            console.error("sync settings failed", error);
            deps.postMessage?.({ type: "RESET" });
            deps.postMessage?.({ type: "START", duration: left });
        name: "meelio:simple-timer",
      },
    ),
      if (typeof chrome !== "undefined" && chrome.runtime) {

        const pause = () => {
          deps.postMessage?.({ type: "PAUSE" });
          set({ isRunning: false, endTimestamp: null, prevRemaining: null });
        };

        const reset = () => {
          const duration = get().durations[TimerStage.Focus];
          deps.postMessage?.({ type: "RESET" });
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
          deps.postMessage?.({ type: "SKIP_TO_NEXT_STAGE" });
          set({
            stage,
            isRunning: false,
            endTimestamp: null,
            prevRemaining: duration,
          });
        };

        const updateDurations = (
          d: Partial<{ focus: number; break: number }>
        ) => {
          set((s) => ({
            durations: {
              [TimerStage.Focus]: d.focus ?? s.durations[TimerStage.Focus],
              [TimerStage.Break]: d.break ?? s.durations[TimerStage.Break],
            },
          }));
          const current = get();
          if (current.isRunning && d[current.stage]) {
            deps.postMessage?.({
              type: "UPDATE_DURATION",
              duration: d[current.stage]!,
            });
          }
        };

        const toggleNotifications = () => {
          set((s) => ({
            settings: {
              ...s.settings,
              notifications: !s.settings.notifications,
            },
          }));
        };

        const toggleSounds = () => {
          set((s) => ({
            settings: { ...s.settings, sounds: !s.settings.sounds },
          }));
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
                deps
                  .pushUsage(unsynced)
                  .then(() => set({ unsyncedFocusSec: 0 }))
                  .catch((error: Error) => {
                    console.error("sync usage failed", error);
                  });
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
          return {
            isLimitReached: used >= limit,
            remainingSec: Math.max(0, limit - used),
          };
        };

        const sync = async () => {
          const auth = useAuthStore.getState();
          if (!auth.user?.isPro) return;
          const settings = get().settings;
          try {
            await deps.pushSettings(settings);
          } catch (error) {
            console.error("sync settings failed", error);
          }
        };

/** Default timer store with browser-based dependencies. */
        const restore = () => {
          const s = get();
          if (!s.isRunning || !s.endTimestamp) return;
          const left = Math.ceil((s.endTimestamp - deps.now()) / 1000);
          if (left <= 0) {
            set({ isRunning: false, endTimestamp: null });
            deps.postMessage?.({ type: "RESET" });
          } else {
            deps.postMessage?.({ type: "START", duration: left });
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
        name: "meelio:simple-timer",
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
  postMessage: (msg) => {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(msg);
      }
    } catch {
      // ignore
    }
  },
});
