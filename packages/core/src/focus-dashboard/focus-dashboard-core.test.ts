import { describe, expect, it } from "vitest";
import { TimerStage } from "@repo/contracts/timer";

import {
  deriveFocusDashboardSnapshot,
  deriveFocusPrimaryAction,
  rankFocusDashboardCards,
} from "./focus-dashboard-core";

describe("focus dashboard core", () => {
  it("derives a review action when the day has no top tasks", () => {
    const action = deriveFocusPrimaryAction({
      timerRunning: false,
      topTasksCount: 0,
    });

    expect(action.kind).toBe("review-plan");
    expect(action.emphasis).toBe("secondary");
  });

  it("derives a resume action when a focus timer is already running", () => {
    const action = deriveFocusPrimaryAction({
      timerRunning: true,
      timerStage: TimerStage.Focus,
      topTasksCount: 2,
    });

    expect(action.kind).toBe("resume-focus-session");
    expect(action.label).toBe("Resume Focus Session");
  });

  it("builds a dashboard snapshot with task progress and ambient fallbacks", () => {
    const snapshot = deriveFocusDashboardSnapshot({
      date: "2026-04-04",
      greeting: "Good evening",
      topTasks: [
        { id: "task-1", title: "Write dashboard shell", completed: true },
        { id: "task-2", title: "Wire focus CTA", completed: false },
      ],
      timerRunning: false,
      timerStage: TimerStage.Focus,
      timerLabel: "Ready to focus",
      blockerMode: "ready",
      soundtrackMode: "available",
      nextEventLabel: "",
    });

    expect(snapshot.topTasksCompleted).toBe(1);
    expect(snapshot.topTasksTotal).toBe(2);
    expect(snapshot.primaryAction.kind).toBe("start-focus-session");
    expect(snapshot.nextEventLabel).toBe("No events scheduled");
  });

  it("ranks the dashboard cards based on immediate user context", () => {
    const ordered = rankFocusDashboardCards({
      timerRunning: true,
      hasUpcomingEvent: true,
      hasTopTasks: true,
      hasReflection: false,
    });

    expect(ordered).toEqual([
      "focus-session",
      "daily-plan",
      "agenda",
      "reflection",
    ]);
  });
});
