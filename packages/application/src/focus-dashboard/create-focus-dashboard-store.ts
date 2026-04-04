import type {
  DailyFocusPlan,
  DailyFocusTask,
  FocusBlockerMode,
  FocusDashboardSnapshot,
  FocusSoundtrackMode,
} from "@repo/contracts/focus-dashboard";
import { TimerStage } from "@repo/contracts/timer";
import { deriveFocusDashboardSnapshot } from "@repo/core/focus-dashboard";
import { create } from "zustand";

export interface FocusDashboardSignals {
  timerRunning: boolean;
  timerStage: TimerStage;
  timerLabel: string;
  blockerMode: FocusBlockerMode;
  soundtrackMode: FocusSoundtrackMode;
  nextEventLabel: string;
}

export interface CreateFocusDashboardStoreInput {
  initialDate: string;
  greeting: string;
}

export interface UpdateDailyPlanInput {
  headline: string;
  intention: string;
  topTasks: DailyFocusTask[];
  sessionTarget: number;
  reflection: string;
}

export interface FocusDashboardState {
  dailyPlan: DailyFocusPlan;
  signals: FocusDashboardSignals;
  snapshot: FocusDashboardSnapshot;
  setDailyPlan: (plan: UpdateDailyPlanInput) => void;
  setSignals: (signals: Partial<FocusDashboardSignals>) => void;
}

const createDailyPlan = (
  date: string,
  plan?: Partial<UpdateDailyPlanInput>
): DailyFocusPlan => ({
  date,
  headline: plan?.headline ?? "",
  intention: plan?.intention ?? "",
  topTasks: plan?.topTasks ?? [],
  sessionTarget: plan?.sessionTarget ?? 0,
  reflection: plan?.reflection ?? "",
});

const createSignals = (
  signals?: Partial<FocusDashboardSignals>
): FocusDashboardSignals => ({
  timerRunning: signals?.timerRunning ?? false,
  timerStage: signals?.timerStage ?? TimerStage.Focus,
  timerLabel: signals?.timerLabel ?? "Ready to focus",
  blockerMode: signals?.blockerMode ?? "ready",
  soundtrackMode: signals?.soundtrackMode ?? "available",
  nextEventLabel: signals?.nextEventLabel ?? "",
});

const buildSnapshot = (
  date: string,
  greeting: string,
  dailyPlan: DailyFocusPlan,
  signals: FocusDashboardSignals
): FocusDashboardSnapshot => {
  const derived = deriveFocusDashboardSnapshot({
    date,
    greeting,
    topTasks: dailyPlan.topTasks,
    timerRunning: signals.timerRunning,
    timerStage: signals.timerStage,
    timerLabel: signals.timerLabel,
    blockerMode: signals.blockerMode,
    soundtrackMode: signals.soundtrackMode,
    nextEventLabel: signals.nextEventLabel,
  });

  return {
    ...derived,
    focusPlan: dailyPlan,
  };
};

export const createFocusDashboardStore = ({
  initialDate,
  greeting,
}: CreateFocusDashboardStoreInput) => {
  const initialPlan = createDailyPlan(initialDate);
  const initialSignals = createSignals();

  return create<FocusDashboardState>()((set) => ({
    dailyPlan: initialPlan,
    signals: initialSignals,
    snapshot: buildSnapshot(initialDate, greeting, initialPlan, initialSignals),
    setDailyPlan: (plan) =>
      set((state) => {
        const dailyPlan = createDailyPlan(initialDate, plan);

        return {
          dailyPlan,
          snapshot: buildSnapshot(initialDate, greeting, dailyPlan, state.signals),
        };
      }),
    setSignals: (signals) =>
      set((state) => {
        const nextSignals = {
          ...state.signals,
          ...signals,
        };

        return {
          signals: nextSignals,
          snapshot: buildSnapshot(
            initialDate,
            greeting,
            state.dailyPlan,
            nextSignals
          ),
        };
      }),
  }));
};
