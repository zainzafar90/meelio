import type { DailyFocusTask } from "@repo/contracts/focus-dashboard";
import { createFocusDashboardStore as createApplicationFocusDashboardStore } from "@repo/application/focus-dashboard";
import type { TimerStage } from "@repo/contracts/timer";

const getTodayKey = () => new Date().toISOString().split("T")[0]!;
const DAILY_FOCUS_PLAN_KEY = "meelio:daily-focus-plan";

const getGreetingLabel = (date: Date) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const readStoredPlan = () => {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(DAILY_FOCUS_PLAN_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as {
      headline: string;
      intention: string;
      topTasks: DailyFocusTask[];
      sessionTarget: number;
      reflection: string;
    };
  } catch {
    return null;
  }
};

const writeStoredPlan = (plan: unknown) => {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(DAILY_FOCUS_PLAN_KEY, JSON.stringify(plan));
};

export const useFocusDashboardStore = createApplicationFocusDashboardStore({
  initialDate: getTodayKey(),
  greeting: getGreetingLabel(new Date()),
});

export const initializeFocusDashboardStore = () => {
  const storedPlan = readStoredPlan();
  if (!storedPlan) {
    return;
  }

  useFocusDashboardStore.getState().setDailyPlan({
    headline: storedPlan.headline,
    intention: storedPlan.intention,
    topTasks: storedPlan.topTasks,
    sessionTarget: storedPlan.sessionTarget,
    reflection: storedPlan.reflection,
  });
};

export const updateDailyFocusPlan = (
  updates: Partial<{
    headline: string;
    intention: string;
    topTasks: DailyFocusTask[];
    sessionTarget: number;
    reflection: string;
  }>
) => {
  const current = useFocusDashboardStore.getState().dailyPlan;
  const nextPlan = {
    ...current,
    ...updates,
    date: getTodayKey(),
  };

  useFocusDashboardStore.getState().setDailyPlan({
    headline: nextPlan.headline,
    intention: nextPlan.intention,
    topTasks: nextPlan.topTasks,
    sessionTarget: nextPlan.sessionTarget,
    reflection: nextPlan.reflection,
  });

  writeStoredPlan(nextPlan);
};

export const syncFocusDashboardSignals = (signals: {
  timerRunning: boolean;
  timerStage: TimerStage;
  timerLabel: string;
  sessionFocusTaskId: string | null;
  blockerMode: "ready" | "active" | "bypassing";
  soundtrackMode: "available" | "playing" | "muted";
  nextEventLabel: string;
  minutesUntilEvent: number | null;
}) => {
  useFocusDashboardStore.getState().setSignals(signals);
};
