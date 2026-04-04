import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  TimerStage,
  type TimerMessage,
  type TimerRuntimeAdapter,
} from "./contracts";

describe("timer contracts", () => {
  it("stays runtime-agnostic and free of host-specific logic", () => {
    const source = readFileSync(
      path.resolve(__dirname, "./contracts.ts"),
      "utf8"
    );

    expect(source).not.toContain("chrome.");
    expect(source).not.toContain("window.");
    expect(source).not.toContain("react");
  });

  it("exposes the timer command and runtime contract types", () => {
    const message: TimerMessage = {
      type: "START",
      duration: 25 * 60,
      stage: TimerStage.Focus,
    };
    const runtime: TimerRuntimeAdapter = {
      sendMessage: (_value) => undefined,
      subscribe: () => () => undefined,
      showNotification: (_title, _message) => undefined,
    };

    expect(message.type).toBe("START");
    expect(runtime.showNotification).toBeTypeOf("function");
  });
});
