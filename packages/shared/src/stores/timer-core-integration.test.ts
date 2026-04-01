import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("shared timer store integration", () => {
  it("delegates timer transitions to timer-core helpers", () => {
    const source = readSource("src/stores/timer.store.ts");

    expect(source).toContain('from "@repo/timer-core"');
    expect(source).toContain("createInitialTimerSnapshot");
    expect(source).toContain("startTimer");
    expect(source).toContain("pauseTimer");
    expect(source).toContain("completeTimerStage");
  });
});
