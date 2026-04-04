import { beforeEach, describe, expect, it, vi } from "vitest";

const addTask = vi.fn();
const addNote = vi.fn();

vi.mock("./task.store", () => ({
  useTaskStore: {
    getState: () => ({
      addTask,
    }),
  },
}));

vi.mock("./note.store", () => ({
  useNoteStore: {
    getState: () => ({
      addNote,
    }),
  },
}));

describe("quick capture store", () => {
  beforeEach(() => {
    vi.resetModules();
    addTask.mockReset();
    addNote.mockReset();
  });

  it("creates pinned tasks through the shared task store", async () => {
    addTask.mockResolvedValue({
      id: "task-1",
      title: "Draft the quick capture bar",
    });

    const module = await import("./quick-capture.store");

    module.useQuickCaptureStore.getState().setValue("Draft the quick capture bar");

    const result = await module.useQuickCaptureStore.getState().submit();

    expect(addTask).toHaveBeenCalledWith({
      title: "Draft the quick capture bar",
      pinned: true,
    });
    expect(result).toEqual({
      mode: "task",
      createdId: "task-1",
      createdTitle: "Draft the quick capture bar",
    });
  });

  it("creates notes through the shared note store", async () => {
    addNote.mockResolvedValue({
      id: "note-1",
      title: "Review the dashboard hierarchy",
    });

    const module = await import("./quick-capture.store");

    module.useQuickCaptureStore.getState().setMode("note");
    module.useQuickCaptureStore
      .getState()
      .setValue("Review the dashboard hierarchy");

    const result = await module.useQuickCaptureStore.getState().submit();

    expect(addNote).toHaveBeenCalledWith({
      title: "Review the dashboard hierarchy",
      content: "Review the dashboard hierarchy",
      pinned: true,
    });
    expect(result).toEqual({
      mode: "note",
      createdId: "note-1",
      createdTitle: "Review the dashboard hierarchy",
    });
  });
});
