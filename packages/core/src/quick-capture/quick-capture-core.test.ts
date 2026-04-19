import { describe, expect, it } from "vitest";

import {
  createQuickCaptureSubmission,
  normalizeQuickCaptureDraft,
} from "./quick-capture-core";

describe("quick capture core", () => {
  it("trims draft input and marks blank submissions as invalid", () => {
    const normalized = normalizeQuickCaptureDraft({
      mode: "task",
      value: "   ",
    });

    expect(normalized.value).toBe("");
    expect(normalized.canSubmit).toBe(false);
  });

  it("creates a task submission with a trimmed title", () => {
    const submission = createQuickCaptureSubmission({
      mode: "task",
      value: "  Draft the quick capture bar  ",
    });

    expect(submission).toEqual({
      mode: "task",
      title: "Draft the quick capture bar",
    });
  });

  it("creates a note submission with a derived title and content", () => {
    const submission = createQuickCaptureSubmission({
      mode: "note",
      value: "Review the dashboard hierarchy before polishing the cards",
    });

    expect(submission).toEqual({
      mode: "note",
      title: "Review the dashboard hierarchy before polishing the cards",
      content: "Review the dashboard hierarchy before polishing the cards",
    });
  });

  it("returns null when the draft is empty after normalization", () => {
    expect(
      createQuickCaptureSubmission({
        mode: "note",
        value: "   ",
      })
    ).toBeNull();
  });
});
