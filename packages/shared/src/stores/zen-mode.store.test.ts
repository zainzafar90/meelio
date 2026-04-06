import { TimerStage } from "@repo/contracts/timer";
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

describe("zen mode store", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("localStorage", createLocalStorage());
  });

  it("starts a Zen session from the current settings and restores the environment on exit", async () => {
    const { useAppStore } = await import("./app.store");
    const { useDockStore } = await import("./dock.store");
    const { useSoundscapesStore } = await import("./soundscapes.store");
    const { useTaskStore } = await import("./task.store");
    const { createZenModeRuntime, useZenModeStore } = await import(
      "./zen-mode.store"
    );

    const start = vi.fn();
    const reset = vi.fn();
    const refreshBrowserCapabilities = vi.fn().mockResolvedValue({
      siteBlocker: "ready",
      tabStash: "ready",
    });
    const enterSiteBlockerSession = vi.fn().mockResolvedValue({
      enabled: false,
      activationMode: "always",
    });
    const exitSiteBlockerSession = vi.fn().mockResolvedValue(undefined);
    const syncSiteBlockerFocusState = vi.fn().mockResolvedValue(undefined);
    const stashTabs = vi.fn().mockResolvedValue(true);

    useAppStore.getState().updateZenModeSettings({
      tabStashEnabled: true,
    });

    useDockStore.setState({
      isTimerVisible: false,
      isSoundscapesVisible: true,
      isTasksVisible: true,
      isSiteBlockerVisible: false,
      isTabStashVisible: false,
    });
    useSoundscapesStore.setState((state) => ({
      ...state,
      sounds: state.sounds.map((sound, index) =>
        index === 0
          ? {
              ...sound,
              playing: true,
              volume: 0.8,
            }
          : {
              ...sound,
              playing: false,
            }
      ),
    }));
    useTaskStore.setState({
      hasInitialized: true,
      isLoading: false,
      tasks: [
        {
          id: "task-1",
          userId: "user-1",
          title: "Ship Zen Mode",
          completed: false,
          pinned: true,
          createdAt: 1,
          updatedAt: 10,
          deletedAt: null,
        },
      ],
    });

    useZenModeStore.getState().setRuntime(
      createZenModeRuntime({
        refreshBrowserCapabilities,
        enterSiteBlockerSession,
        exitSiteBlockerSession,
        syncSiteBlockerFocusState,
        stashTabs,
      })
    );

    await useZenModeStore.getState().refreshBrowserCapabilities();
    await useZenModeStore.getState().startSession({
      isRunning: false,
      stage: TimerStage.Focus,
      start,
      reset,
    });

    expect(start).toHaveBeenCalledTimes(1);
    expect(enterSiteBlockerSession).toHaveBeenCalledTimes(1);
    expect(stashTabs).toHaveBeenCalledTimes(1);
    expect(useZenModeStore.getState().phase).toBe("active");
    expect(useZenModeStore.getState().sessionTaskId).toBe("task-1");
    expect(useZenModeStore.getState().didStashTabs).toBe(true);
    expect(useDockStore.getState().isTimerVisible).toBe(true);

    await useZenModeStore.getState().syncSessionFocusState({
      isRunning: false,
      stage: TimerStage.Break,
    });

    expect(syncSiteBlockerFocusState).toHaveBeenCalledWith({
      isRunning: false,
      stage: TimerStage.Break,
    });

    useSoundscapesStore.setState((state) => ({
      ...state,
      sounds: state.sounds.map((sound) => ({
        ...sound,
        playing: false,
      })),
    }));
    useDockStore.setState({
      isTimerVisible: true,
      isSoundscapesVisible: false,
      isTasksVisible: false,
      isSiteBlockerVisible: true,
      isTabStashVisible: true,
    });

    await useZenModeStore.getState().endSession({
      isRunning: true,
      stage: TimerStage.Focus,
      start,
      reset,
    });

    expect(reset).toHaveBeenCalledTimes(1);
    expect(exitSiteBlockerSession).toHaveBeenCalledWith({
      enabled: false,
      activationMode: "always",
    });
    expect(useZenModeStore.getState().phase).toBe("inactive");
    expect(useZenModeStore.getState().sessionTaskId).toBeNull();
    expect(useDockStore.getState().isTimerVisible).toBe(false);
    expect(useDockStore.getState().isSoundscapesVisible).toBe(true);
    expect(useDockStore.getState().isTasksVisible).toBe(true);
    expect(
      useSoundscapesStore
        .getState()
        .sounds.find((sound) => sound.playing)?.id
    ).toBe(useSoundscapesStore.getState().sounds[0]?.id);
  });

  it("skips extension-only steps when browser capabilities are unavailable", async () => {
    const { useAppStore } = await import("./app.store");
    const { useTaskStore } = await import("./task.store");
    const { createZenModeRuntime, useZenModeStore } = await import(
      "./zen-mode.store"
    );

    const start = vi.fn();
    const refreshBrowserCapabilities = vi.fn().mockResolvedValue({
      siteBlocker: "unavailable",
      tabStash: "unavailable",
    });
    const enterSiteBlockerSession = vi.fn().mockResolvedValue(null);
    const syncSiteBlockerFocusState = vi.fn().mockResolvedValue(undefined);
    const stashTabs = vi.fn().mockResolvedValue(false);

    useAppStore.getState().setPlatform("web");
    useAppStore.getState().updateZenModeSettings({
      tabStashEnabled: true,
    });
    useTaskStore.setState({
      hasInitialized: true,
      isLoading: false,
      tasks: [],
    });

    useZenModeStore.getState().setRuntime(
      createZenModeRuntime({
        refreshBrowserCapabilities,
        enterSiteBlockerSession,
        syncSiteBlockerFocusState,
        exitSiteBlockerSession: vi.fn().mockResolvedValue(undefined),
        stashTabs,
      })
    );

    await useZenModeStore.getState().refreshBrowserCapabilities();
    await useZenModeStore.getState().startSession({
      isRunning: false,
      stage: TimerStage.Focus,
      start,
      reset: vi.fn(),
    });

    expect(start).toHaveBeenCalledTimes(1);
    expect(enterSiteBlockerSession).not.toHaveBeenCalled();
    expect(stashTabs).not.toHaveBeenCalled();
    expect(useZenModeStore.getState().browserCapabilities).toEqual({
      siteBlocker: "unavailable",
      tabStash: "unavailable",
    });

    await useZenModeStore.getState().syncSessionFocusState({
      isRunning: true,
      stage: TimerStage.Focus,
    });

    expect(syncSiteBlockerFocusState).not.toHaveBeenCalled();
  });
});
