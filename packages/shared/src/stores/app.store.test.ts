import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("app store", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("localStorage", createLocalStorage());
  });

  it("defaults Zen Mode settings to the recommended focus ritual", async () => {
    const { useAppStore } = await import("./app.store");

    expect(useAppStore.getState().zenMode).toEqual({
      timerEnabled: true,
      soundscapesEnabled: true,
      pinnedTaskSyncEnabled: true,
      siteBlockerEnabled: true,
      tabStashEnabled: false,
    });
  });

  it("merges Zen Mode setting updates without dropping the other toggles", async () => {
    const { useAppStore } = await import("./app.store");

    useAppStore.getState().updateZenModeSettings({
      timerEnabled: false,
      tabStashEnabled: true,
    });

    expect(useAppStore.getState().zenMode).toEqual({
      timerEnabled: false,
      soundscapesEnabled: true,
      pinnedTaskSyncEnabled: true,
      siteBlockerEnabled: true,
      tabStashEnabled: true,
    });
  });
});
