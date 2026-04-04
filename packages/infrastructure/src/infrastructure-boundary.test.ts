import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, relativePath), "utf8");

describe("infrastructure package boundaries", () => {
  it("contains concrete timer persistence and event adapters without UI code", () => {
    const source = readSource("./timer/index.ts");

    expect(source).toContain("soundSyncService");
    expect(source).toContain("addSimpleTimerFocusTime");
    expect(source).toContain("timerEvents.emit");
    expect(source).not.toContain("react");
    expect(source).not.toContain("chrome.runtime");
  });
});
