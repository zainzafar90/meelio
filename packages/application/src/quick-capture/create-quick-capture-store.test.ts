import { describe, expect, it, vi } from "vitest";

import { createQuickCaptureStore } from "./create-quick-capture-store";

describe("createQuickCaptureStore", () => {
  it("updates the draft, derives submit readiness, and resets after task submission", async () => {
    const submitTask = vi.fn(async ({ title }: { title: string }) => ({
      createdId: "task-1",
      createdTitle: title,
    }));
    const submitNote = vi.fn();
    const store = createQuickCaptureStore({
      submitTask,
      submitNote,
    });

    store.getState().setValue("  Draft the quick capture bar  ");

    expect(store.getState().draft.value).toBe("  Draft the quick capture bar  ");
    expect(store.getState().canSubmit).toBe(true);

    const result = await store.getState().submit();

    expect(submitTask).toHaveBeenCalledWith({
      title: "Draft the quick capture bar",
    });
    expect(submitNote).not.toHaveBeenCalled();
    expect(result).toEqual({
      mode: "task",
      createdId: "task-1",
      createdTitle: "Draft the quick capture bar",
    });
    expect(store.getState().draft.value).toBe("");
    expect(store.getState().lastSubmission?.mode).toBe("task");
  });

  it("routes note submissions through the note submitter", async () => {
    const submitTask = vi.fn();
    const submitNote = vi.fn(
      async ({
        title,
        content,
      }: {
        title: string;
        content?: string;
      }) => ({
        createdId: "note-1",
        createdTitle: `${title}:${content}`,
      })
    );
    const store = createQuickCaptureStore({
      submitTask,
      submitNote,
    });

    store.getState().setMode("note");
    store.getState().setValue("Review the dashboard hierarchy");

    const result = await store.getState().submit();

    expect(submitTask).not.toHaveBeenCalled();
    expect(submitNote).toHaveBeenCalledWith({
      title: "Review the dashboard hierarchy",
      content: "Review the dashboard hierarchy",
    });
    expect(result?.mode).toBe("note");
  });

  it("does not submit blank drafts", async () => {
    const submitTask = vi.fn();
    const submitNote = vi.fn();
    const store = createQuickCaptureStore({
      submitTask,
      submitNote,
    });

    store.getState().setValue("   ");

    const result = await store.getState().submit();

    expect(result).toBeNull();
    expect(submitTask).not.toHaveBeenCalled();
    expect(submitNote).not.toHaveBeenCalled();
    expect(store.getState().canSubmit).toBe(false);
  });
});
