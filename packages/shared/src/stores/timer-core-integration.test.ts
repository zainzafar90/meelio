import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("shared timer store integration", () => {
  it("delegates timer behavior to the layered timer packages", () => {
    const source = readSource("src/stores/timer.store.ts");

    expect(source).toContain('from "@repo/application/timer"');
    expect(source).toContain('from "@repo/infrastructure/timer"');
    expect(source).toContain("createApplicationTimerStore(runtime, {");
    expect(source).not.toContain("createInitialTimerSnapshot");
    expect(source).not.toContain("startTimer(");
    expect(source).not.toContain("pauseTimer(");
    expect(source).not.toContain("completeTimerStage(");
  });
});
