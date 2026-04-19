import { describe, expect, it } from "vitest";

import {
  getAgendaPillValue,
  getPinnedTask,
  getTaskPillSummary,
  getZenModeStatus,
  selectFocusTasks,
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

  it("prioritizes pinned and recently updated focus tasks", () => {
    expect(
      selectFocusTasks([
        {
          id: "task-1",
          title: "Older unpinned",
          pinned: false,
          completed: false,
          updatedAt: 10,
        },
        {
          id: "task-2",
          title: "Pinned task",
          pinned: true,
          completed: false,
          updatedAt: 5,
        },
        {
          id: "task-3",
          title: "Recent unpinned",
          pinned: false,
          completed: false,
          updatedAt: 20,
        },
        {
          id: "task-4",
          title: "Completed task",
          pinned: true,
          completed: true,
          updatedAt: 50,
        },
      ]),
    ).toEqual([
      {
        id: "task-2",
        title: "Pinned task",
        completed: false,
        pinned: true,
      },
      {
        id: "task-3",
        title: "Recent unpinned",
        completed: false,
        pinned: false,
      },
      {
        id: "task-1",
        title: "Older unpinned",
        completed: false,
        pinned: false,
      },
    ]);
  });

  it("returns the newest pinned incomplete task", () => {
    expect(
      getPinnedTask([
        {
          id: "task-1",
          title: "Older pinned",
          pinned: true,
          completed: false,
          updatedAt: 10,
        },
        {
          id: "task-2",
          title: "Newest pinned",
          pinned: true,
          completed: false,
          updatedAt: 20,
        },
        {
          id: "task-3",
          title: "Deleted pinned",
          pinned: true,
          completed: false,
          updatedAt: 30,
          deletedAt: Date.now(),
        },
      ]),
    ).toMatchObject({
      id: "task-2",
      title: "Newest pinned",
    });
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
