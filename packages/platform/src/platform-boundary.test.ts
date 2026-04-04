import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, relativePath), "utf8");

describe("platform package boundaries", () => {
  it("keeps extension adapters browser-specific and free of UI imports", () => {
    const runtimeSource = readSource("./extension/site-blocker/runtime.ts");
    const timerSource = readSource("./extension/timer/runtime.ts");

    expect(runtimeSource).toContain("chrome.runtime");
    expect(timerSource).toContain("chrome.runtime");
    expect(runtimeSource).not.toContain("react");
    expect(timerSource).not.toContain("react");
    expect(runtimeSource).not.toContain("@repo/shared");
    expect(timerSource).not.toContain("@repo/shared");
  });

  it("keeps web adapters focused on host runtime concerns", () => {
    const source = readSource("./web/timer/runtime.ts");

    expect(source).toContain("new Notification");
    expect(source).toContain("new this.WorkerCtor()");
    expect(source).not.toContain("@repo/shared");
  });
});
