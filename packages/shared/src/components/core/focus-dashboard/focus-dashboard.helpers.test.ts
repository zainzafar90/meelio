import { describe, expect, it } from "vitest";

import {
  getAgendaPillValue,
  getTaskPillSummary,
  getZenModeStatus,
} from "./focus-dashboard.helpers";

describe("focus dashboard pill helpers", () => {
  it("counts queued and completed tasks from the live task list", () => {
    const summary = getTaskPillSummary([
      { completed: false, deletedAt: null },
      { completed: true, deletedAt: null },
      { completed: false, deletedAt: Date.now() },
      { completed: false, deletedAt: null },
    ]);

    expect(summary.queuedCount).toBe(2);
    expect(summary.completedCount).toBe(1);
  });

  it("prefers the actual calendar event summary for the pill value", () => {
    expect(
      getAgendaPillValue({
        id: "event-1",
        summary: "Design review",
        start: { dateTime: "2026-04-05T09:00:00.000Z" },
        end: { dateTime: "2026-04-05T10:00:00.000Z" },
      }),
    ).toBe("Design review");
  });

  it("falls back when no upcoming event exists", () => {
    expect(getAgendaPillValue(null)).toBe("No upcoming event");
  });

  it("maps Zen readiness into calm status copy", () => {
    expect(
      getZenModeStatus({
        enabled: true,
        availability: "ready",
        readyValue: "Ready",
        activeValue: "Running",
        labels: {
          off: "Off",
          unavailable: "Extension only",
          permissionNeeded: "Permission needed",
          stashed: "Stashed",
        },
      }),
    ).toEqual({
      tone: "ready",
      value: "Ready",
    });
  });

  it("surfaces permission and stashed states explicitly", () => {
    expect(
      getZenModeStatus({
        enabled: true,
        availability: "permission-needed",
        readyValue: "Ready",
        activeValue: "Running",
        labels: {
          off: "Off",
          unavailable: "Extension only",
          permissionNeeded: "Permission needed",
          stashed: "Stashed",
        },
      }),
    ).toEqual({
      tone: "warning",
      value: "Permission needed",
    });

    expect(
      getZenModeStatus({
        enabled: true,
        availability: "ready",
        isStashed: true,
        readyValue: "Ready",
        activeValue: "Running",
        labels: {
          off: "Off",
          unavailable: "Extension only",
          permissionNeeded: "Permission needed",
          stashed: "Stashed",
        },
      }),
    ).toEqual({
      tone: "active",
      value: "Stashed",
    });
  });
});
