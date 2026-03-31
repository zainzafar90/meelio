import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("content entrypoint", () => {
  it("stays tracker-only and does not mutate blocker state directly", () => {
    const source = readFileSync(
      resolve(__dirname, "../entrypoints/content.tsx"),
      "utf8"
    );

    expect(source).toContain('type: "tracking/session-update"');
    expect(source).toContain('type: "tracking/session-end"');
    expect(source).not.toContain("chrome.storage");
    expect(source).not.toContain('type: "blocker/set-enabled"');
    expect(source).not.toContain('type: "blocker/add-rule"');
    expect(source).not.toContain('type: "blocker/toggle-rule"');
    expect(source).not.toContain('type: "blocker/remove-rule"');
  });
});
