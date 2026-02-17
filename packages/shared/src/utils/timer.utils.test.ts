import { describe, expect, it } from "vitest";

import { TimerStage } from "../types/timer.types";
import { formatTime, getNextStage, getSessionCount, getTime } from "./timer.utils";

describe("timer.utils", () => {
  it("formats seconds as mm:ss", () => {
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(0)).toBe("0:00");
  });

  it("derives timer state helpers", () => {
    expect(getNextStage(TimerStage.Focus)).toBe(TimerStage.Break);
    expect(getSessionCount(TimerStage.Focus, 2)).toBe(3);
    expect(getSessionCount(TimerStage.Break, 2)).toBe(2);
    expect(getTime(150)).toEqual([0, 2, 3, 0]);
  });
});
