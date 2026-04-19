import { describe, expect, it } from "vitest";

import { createDailyFocusStorage } from "./daily-focus-storage";

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
};

describe("createDailyFocusStorage", () => {
  it("persists and restores the daily focus plan", () => {
    const storage = createDailyFocusStorage(createMemoryStorage());
    const plan = {
      date: "2026-04-04",
      headline: "Ship dashboard shell",
      intention: "Focus on the first coherent workflow.",
      topTasks: [
        { id: "task-1", title: "Build dashboard shell", completed: false },
      ],
      sessionTarget: 3,
      reflection: "",
    };

    storage.saveDailyFocusPlan(plan);

    expect(storage.loadDailyFocusPlan()).toEqual(plan);
  });

  it("returns null for invalid or missing payloads", () => {
    const memory = createMemoryStorage();
    memory.setItem("meelio:daily-focus-plan", "{bad json");
    const storage = createDailyFocusStorage(memory);

    expect(storage.loadDailyFocusPlan()).toBeNull();

    storage.clearDailyFocusPlan();
    expect(storage.loadDailyFocusPlan()).toBeNull();
  });
});
