import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  type QuickCaptureDraft,
  type QuickCaptureMode,
  type QuickCaptureSubmissionResult,
} from "./contracts";

describe("quick capture contracts", () => {
  it("stay runtime-agnostic and free of host-specific logic", () => {
    const source = readFileSync(
      path.resolve(__dirname, "./contracts.ts"),
      "utf8"
    );

    expect(source).not.toContain("chrome.");
    expect(source).not.toContain("window.");
    expect(source).not.toContain("react");
  });

  it("expose capture mode, draft, and submission result contracts", () => {
    const mode: QuickCaptureMode = "task";
    const draft: QuickCaptureDraft = {
      mode,
      value: "Draft the quick capture bar",
    };
    const result: QuickCaptureSubmissionResult = {
      mode: "note",
      createdId: "note-1",
      createdTitle: "Review the dashboard hierarchy",
    };

    expect(draft.mode).toBe("task");
    expect(result.mode).toBe("note");
  });
});
