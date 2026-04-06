import { describe, expect, it } from "vitest";

import { getTaskFocusActionCopy } from "./task-list.helpers";

describe("task list focus action copy", () => {
  it("shows Focus for active incomplete tasks", () => {
    expect(
      getTaskFocusActionCopy({
        id: "task-1",
        userId: "user-1",
        title: "Write spec",
        completed: false,
        pinned: false,
        createdAt: 0,
        updatedAt: 0,
      }),
    ).toEqual({
      labelKey: "tasks.item.focus",
      label: "Focus",
      titleKey: "tasks.item.focusTitle",
      title: "Set this as your current focus task.",
    });
  });

  it("shows Focused for the pinned task", () => {
    expect(
      getTaskFocusActionCopy({
        id: "task-1",
        userId: "user-1",
        title: "Write spec",
        completed: false,
        pinned: true,
        createdAt: 0,
        updatedAt: 0,
      }),
    ).toEqual({
      labelKey: "tasks.item.focused",
      label: "Focused",
      titleKey: "tasks.item.focusedTitle",
      title: "This task is set as your current focus task.",
    });
  });

  it("hides the focus action for completed tasks", () => {
    expect(
      getTaskFocusActionCopy({
        id: "task-1",
        userId: "user-1",
        title: "Write spec",
        completed: true,
        pinned: false,
        createdAt: 0,
        updatedAt: 0,
      }),
    ).toBeNull();
  });
});
