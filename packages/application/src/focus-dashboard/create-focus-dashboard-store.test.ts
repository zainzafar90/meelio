import { describe, expect, it } from "vitest";
import { TimerStage } from "@repo/contracts/timer";

import { createFocusDashboardStore } from "./create-focus-dashboard-store";

describe("createFocusDashboardStore", () => {
  it("updates the daily plan and derives a snapshot for the dashboard", () => {
    const store = createFocusDashboardStore({
      initialDate: "2026-04-04",
      greeting: "Good evening",
    });

    store.getState().setDailyPlan({
      headline: "Ship dashboard shell",
      intention: "Build the dashboard before adding more cards.",
      topTasks: [
        {
          id: "task-1",
          title: "Create daily plan card",
          completed: false,
          pinned: true,
        },
      ],
      sessionTarget: 3,
      reflection: "",
    });

    const snapshot = store.getState().snapshot;

    expect(snapshot.focusPlan.headline).toBe("Ship dashboard shell");
    expect(snapshot.topTasksTotal).toBe(1);
    expect(snapshot.primaryAction.kind).toBe("start-focus-session");
    expect(snapshot.activeFocusTaskLabel).toBe("Create daily plan card");
  });

  it("asks the user to choose a focus task when tasks exist but none is pinned", () => {
    const store = createFocusDashboardStore({
      initialDate: "2026-04-04",
      greeting: "Good evening",
    });

    store.getState().setDailyPlan({
      headline: "Protect focus time",
      intention: "Pick the right task before starting.",
      topTasks: [
        { id: "task-1", title: "Start focus mode", completed: false, pinned: false },
      ],
      sessionTarget: 2,
      reflection: "",
    });

    const snapshot = store.getState().snapshot;

    expect(snapshot.primaryAction.kind).toBe("choose-focus-task");
    expect(snapshot.activeFocusTaskId).toBeNull();
  });

  it("recomputes the primary action when timer signals change", () => {
    const store = createFocusDashboardStore({
      initialDate: "2026-04-04",
      greeting: "Good evening",
    });

    store.getState().setDailyPlan({
      headline: "Protect focus time",
      intention: "Use the timer and blocker together.",
      topTasks: [
        { id: "task-1", title: "Start focus mode", completed: false },
      ],
      sessionTarget: 2,
      reflection: "",
    });
    store.getState().setSignals({
      timerRunning: true,
      timerStage: TimerStage.Focus,
      timerLabel: "12:00 remaining",
      blockerMode: "active",
      soundtrackMode: "playing",
      nextEventLabel: "Design review at 7:00 PM",
      minutesUntilEvent: 18,
    });

    const snapshot = store.getState().snapshot;

    expect(snapshot.primaryAction.kind).toBe("resume-focus-session");
    expect(snapshot.currentTimerLabel).toBe("12:00 remaining");
    expect(snapshot.blockerMode).toBe("active");
    expect(snapshot.agendaWindowLabel).toContain("18 min");
  });
});
