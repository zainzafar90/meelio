import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimerStage } from "@repo/contracts/timer";

const createLocalStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

describe("focus dashboard store", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("localStorage", createLocalStorage());
  });

  it("persists daily plan updates to localStorage", async () => {
    const module = await import("./focus-dashboard.store");

    module.updateDailyFocusPlan({
      headline: "Ship the dashboard polish",
      intention: "Refine hierarchy before adding more scope.",
      topTasks: [
        { id: "task-1", title: "Polish focus card", completed: false },
      ],
      sessionTarget: 2,
      reflection: "Keep the surface calm.",
    });

    const snapshot = module.useFocusDashboardStore.getState().snapshot;
    const saved = localStorage.getItem("meelio:daily-focus-plan");

    expect(snapshot.focusPlan.headline).toBe("Ship the dashboard polish");
    expect(saved).toContain("Ship the dashboard polish");
  });

  it("updates the dashboard snapshot when runtime signals change", async () => {
    const module = await import("./focus-dashboard.store");

    module.syncFocusDashboardSignals({
      timerRunning: true,
      timerStage: TimerStage.Focus,
      timerLabel: "08:00 remaining",
      blockerMode: "active",
      soundtrackMode: "playing",
      nextEventLabel: "Next: Design review",
      minutesUntilEvent: 18,
    });

    const snapshot = module.useFocusDashboardStore.getState().snapshot;

    expect(snapshot.currentTimerRunning).toBe(true);
    expect(snapshot.currentTimerLabel).toBe("08:00 remaining");
    expect(snapshot.blockerMode).toBe("active");
    expect(snapshot.nextEventLabel).toBe("Next: Design review");
    expect(snapshot.agendaWindowLabel).toContain("18 min");
  });
});
