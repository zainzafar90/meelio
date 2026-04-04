import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  type DailyFocusPlan,
  type FocusDashboardSnapshot,
  type FocusPrimaryAction,
} from "./contracts";

describe("focus dashboard contracts", () => {
  it("stay runtime-agnostic and free of host-specific logic", () => {
    const source = readFileSync(
      path.resolve(__dirname, "./contracts.ts"),
      "utf8"
    );

    expect(source).not.toContain("chrome.");
    expect(source).not.toContain("window.");
    expect(source).not.toContain("react");
  });

  it("expose dashboard, daily plan, and primary action types", () => {
    const plan: DailyFocusPlan = {
      date: "2026-04-04",
      headline: "Ship phase 1 dashboard",
      intention: "Turn separate focus tools into one coherent ritual.",
      topTasks: [
        { id: "task-1", title: "Define dashboard structure", completed: false },
      ],
      sessionTarget: 4,
      reflection: "",
    };
    const action: FocusPrimaryAction = {
      kind: "start-focus-session",
      label: "Start Focus Session",
      description: "Launch a guided session with timer and blockers.",
      emphasis: "primary",
    };
    const snapshot: FocusDashboardSnapshot = {
      date: "2026-04-04",
      greeting: "Good evening",
      headline: "Your day is ready",
      focusPlan: plan,
      topTasksCompleted: 0,
      topTasksTotal: 1,
      currentTimerLabel: "Ready to focus",
      currentTimerRunning: false,
      blockerMode: "ready",
      soundtrackMode: "available",
      nextEventLabel: "No events scheduled",
      primaryAction: action,
    };

    expect(snapshot.focusPlan.headline).toBe("Ship phase 1 dashboard");
    expect(snapshot.primaryAction.kind).toBe("start-focus-session");
  });
});
