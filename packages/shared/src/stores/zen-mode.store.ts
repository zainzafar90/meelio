import type { ActivationMode } from "@repo/contracts/site-blocker";
import { TimerStage } from "@repo/contracts/timer";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SoundState } from "../types/sound";
import { useAppStore } from "./app.store";
import { useDockStore } from "./dock.store";
import { useSoundscapesStore } from "./soundscapes.store";
import { useTaskStore } from "./task.store";

export type ZenModePhase = "inactive" | "starting" | "active" | "ending";
export type ZenModeBrowserCapability =
  | "ready"
  | "permission-needed"
  | "unavailable"
  | "error";

export interface ZenModeTimerController {
  isRunning: boolean;
  stage: TimerStage;
  start: () => void;
  reset: () => void;
}

export interface ZenModeSiteBlockerSnapshot {
  enabled: boolean;
  activationMode: ActivationMode;
}

export interface ZenModeBrowserCapabilities {
  siteBlocker: ZenModeBrowserCapability;
  tabStash: ZenModeBrowserCapability;
}

export interface ZenModeRuntime {
  refreshBrowserCapabilities: () => Promise<ZenModeBrowserCapabilities>;
  enterSiteBlockerSession: () => Promise<ZenModeSiteBlockerSnapshot | null>;
  exitSiteBlockerSession: (
    snapshot: ZenModeSiteBlockerSnapshot | null
  ) => Promise<void>;
  syncSiteBlockerFocusState: (state: {
    isRunning: boolean;
    stage: TimerStage;
  }) => Promise<void>;
  stashTabs: () => Promise<boolean>;
}

interface ZenModeSnapshot {
  dock: {
    isTimerVisible: boolean;
    isSoundscapesVisible: boolean;
    isTasksVisible: boolean;
    isSiteBlockerVisible: boolean;
    isTabStashVisible: boolean;
  };
  soundState: SoundState[];
  siteBlocker: ZenModeSiteBlockerSnapshot | null;
}

interface ZenModeState {
  phase: ZenModePhase;
  browserCapabilities: ZenModeBrowserCapabilities;
  didStashTabs: boolean;
  sessionTaskId: string | null;
  lastError: string | null;
  runtime: ZenModeRuntime;
  snapshot: ZenModeSnapshot | null;
  setRuntime: (runtime: ZenModeRuntime) => void;
  refreshBrowserCapabilities: () => Promise<ZenModeBrowserCapabilities>;
  startSession: (timer: ZenModeTimerController) => Promise<void>;
  endSession: (timer: ZenModeTimerController) => Promise<void>;
  syncSessionFocusState: (state: {
    isRunning: boolean;
    stage: TimerStage;
  }) => Promise<void>;
  reset: () => void;
}

const defaultBrowserCapabilities = (): ZenModeBrowserCapabilities => ({
  siteBlocker: "unavailable",
  tabStash: "unavailable",
});

const createDefaultRuntime = (): ZenModeRuntime => ({
  refreshBrowserCapabilities: async () => defaultBrowserCapabilities(),
  enterSiteBlockerSession: async () => null,
  exitSiteBlockerSession: async () => undefined,
  syncSiteBlockerFocusState: async () => undefined,
  stashTabs: async () => false,
});

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Zen Mode could not start.";

const captureSnapshot = (): ZenModeSnapshot => {
  const dockState = useDockStore.getState();
  const soundState = useSoundscapesStore.getState().captureSoundState();

  return {
    dock: {
      isTimerVisible: dockState.isTimerVisible,
      isSoundscapesVisible: dockState.isSoundscapesVisible,
      isTasksVisible: dockState.isTasksVisible,
      isSiteBlockerVisible: dockState.isSiteBlockerVisible,
      isTabStashVisible: dockState.isTabStashVisible,
    },
    soundState,
    siteBlocker: null,
  };
};

const applyDockSnapshot = (snapshot: ZenModeSnapshot["dock"]) => {
  const dockState = useDockStore.getState();
  dockState.setTimerVisible(snapshot.isTimerVisible);
  dockState.setSoundscapesVisible(snapshot.isSoundscapesVisible);
  dockState.setTasksVisible(snapshot.isTasksVisible);
  dockState.setSiteBlockerVisible(snapshot.isSiteBlockerVisible);
  dockState.setTabStashVisible(snapshot.isTabStashVisible);
};

export const createZenModeRuntime = (runtime: Partial<ZenModeRuntime>) => ({
  ...createDefaultRuntime(),
  ...runtime,
});

export const useZenModeStore = create<ZenModeState>()(
  persist(
  (set, get) => ({
  phase: "inactive",
  browserCapabilities: defaultBrowserCapabilities(),
  didStashTabs: false,
  sessionTaskId: null,
  lastError: null,
  runtime: createDefaultRuntime(),
  snapshot: null,
  setRuntime: (runtime) => {
    set({ runtime });
  },
  refreshBrowserCapabilities: async () => {
    const platform = useAppStore.getState().platform;

    if (platform === "web") {
      const capabilities = defaultBrowserCapabilities();
      set({ browserCapabilities: capabilities });
      return capabilities;
    }

    try {
      const capabilities = await get().runtime.refreshBrowserCapabilities();
      set({ browserCapabilities: capabilities });
      return capabilities;
    } catch (error) {
      const capabilities = {
        siteBlocker: "error",
        tabStash: "error",
      } as const;
      set({
        browserCapabilities: capabilities,
        lastError: toErrorMessage(error),
      });
      return capabilities;
    }
  },
  startSession: async (timer) => {
    if (get().phase !== "inactive") {
      return;
    }

    const appState = useAppStore.getState();
    const settings = appState.zenMode;
    const taskState = useTaskStore.getState();

    set({
      phase: "starting",
      lastError: null,
      didStashTabs: false,
    });

    try {
      if (!taskState.hasInitialized && !taskState.isLoading) {
        await taskState.initializeStore();
      }

      const snapshot = captureSnapshot();
      const browserCapabilities = await get().refreshBrowserCapabilities();
      const pinnedTask = settings.pinnedTaskSyncEnabled
        ? useTaskStore.getState().getNextPinnedTask()
        : undefined;

      useDockStore.getState().setTimerVisible(true);

      let siteBlockerSnapshot: ZenModeSiteBlockerSnapshot | null = null;
      if (
        settings.siteBlockerEnabled &&
        browserCapabilities.siteBlocker === "ready"
      ) {
        siteBlockerSnapshot = await get().runtime.enterSiteBlockerSession();
      }

      let didStashTabs = false;
      if (settings.tabStashEnabled && browserCapabilities.tabStash === "ready") {
        didStashTabs = await get().runtime.stashTabs();
      }

      if (settings.timerEnabled && !timer.isRunning) {
        timer.start();
      }

      set({
        phase: "active",
        snapshot: {
          ...snapshot,
          siteBlocker: siteBlockerSnapshot,
        },
        didStashTabs,
        sessionTaskId: pinnedTask?.id ?? null,
      });
    } catch (error) {
      set({
        phase: "inactive",
        snapshot: null,
        sessionTaskId: null,
        didStashTabs: false,
        lastError: toErrorMessage(error),
      });
    }
  },
  endSession: async (timer) => {
    if (get().phase === "inactive") {
      return;
    }

    const snapshot = get().snapshot;
    set({ phase: "ending" });

    try {
      timer.reset();
      if (snapshot) {
        await get().runtime.exitSiteBlockerSession(snapshot.siteBlocker);
        useSoundscapesStore.getState().restoreSoundState(snapshot.soundState);
        applyDockSnapshot(snapshot.dock);
      }
    } finally {
      set({
        phase: "inactive",
        snapshot: null,
        didStashTabs: false,
        sessionTaskId: null,
      });
    }
  },
  syncSessionFocusState: async ({ isRunning, stage }) => {
    const { phase, browserCapabilities } = get();
    const { zenMode } = useAppStore.getState();

    if (
      phase !== "active" ||
      !zenMode.siteBlockerEnabled ||
      browserCapabilities.siteBlocker !== "ready"
    ) {
      return;
    }

    await get().runtime.syncSiteBlockerFocusState({
      isRunning,
      stage,
    });
  },
  reset: () => {
    set({
      phase: "inactive",
      browserCapabilities: defaultBrowserCapabilities(),
      didStashTabs: false,
      sessionTaskId: null,
      lastError: null,
      runtime: createDefaultRuntime(),
      snapshot: null,
    });
  },
}),
    {
      name: "meelio:local:zen-mode",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        phase: state.phase,
        sessionTaskId: state.sessionTaskId,
        didStashTabs: state.didStashTabs,
      }),
    },
  ),
);
