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

  it("derives a choose-task action when work exists but no focus task is selected", () => {
    const action = deriveFocusPrimaryAction({
      timerRunning: false,
      topTasksCount: 2,
      activeFocusTaskLabel: "",
    });

    expect(action.kind).toBe("choose-focus-task");
    expect(action.emphasis).toBe("secondary");
  });

  it("derives a resume action when a focus timer is already running", () => {
    const action = deriveFocusPrimaryAction({
      timerRunning: true,
      timerStage: TimerStage.Focus,
      topTasksCount: 2,
      activeFocusTaskLabel: "Ship dashboard shell",
    });

    expect(action.kind).toBe("resume-focus-session");
    expect(action.label).toBe("Resume Focus: Ship dashboard shell");
  });

  it("derives a start action that references the active focus task and time window", () => {
    const action = deriveFocusPrimaryAction({
      timerRunning: false,
      topTasksCount: 2,
      activeFocusTaskLabel: "Draft the release plan",
      minutesUntilEvent: 24,
    });

    expect(action.kind).toBe("start-focus-session");
    expect(action.label).toBe("Use 24 min for: Draft the release plan");
    expect(action.description).toContain("next event");
  });

  it("builds a dashboard snapshot with task progress and ambient fallbacks", () => {
    const snapshot = deriveFocusDashboardSnapshot({
      date: "2026-04-04",
      greeting: "Good evening",
      topTasks: [
        {
          id: "task-1",
          title: "Write dashboard shell",
          completed: true,
          pinned: false,
        },
        {
          id: "task-2",
          title: "Wire focus CTA",
          completed: false,
          pinned: true,
        },
      ],
      timerRunning: false,
      timerStage: TimerStage.Focus,
      timerLabel: "Ready to focus",
      blockerMode: "ready",
      soundtrackMode: "available",
      nextEventLabel: "",
      minutesUntilEvent: null,
    });

    expect(snapshot.topTasksCompleted).toBe(1);
    expect(snapshot.topTasksTotal).toBe(2);
    expect(snapshot.primaryAction.kind).toBe("start-focus-session");
    expect(snapshot.nextEventLabel).toBe("No events scheduled");
    expect(snapshot.activeFocusTaskId).toBe("task-2");
    expect(snapshot.activeFocusTaskLabel).toBe("Wire focus CTA");
    expect(snapshot.agendaWindowLabel).toBe("Calendar is clear for deep work.");
  });

  it("leaves the active focus task empty when no task is pinned", () => {
    const snapshot = deriveFocusDashboardSnapshot({
      date: "2026-04-04",
      greeting: "Good evening",
      topTasks: [
        {
          id: "task-1",
          title: "Write dashboard shell",
          completed: false,
          pinned: false,
        },
        {
          id: "task-2",
          title: "Wire focus CTA",
          completed: false,
          pinned: false,
        },
      ],
      timerRunning: false,
      timerStage: TimerStage.Focus,
      timerLabel: "Ready to focus",
      blockerMode: "ready",
      soundtrackMode: "available",
      nextEventLabel: "",
      minutesUntilEvent: null,
    });

    expect(snapshot.activeFocusTaskId).toBeNull();
    expect(snapshot.primaryAction.kind).toBe("choose-focus-task");
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
