import { useReducedMotion } from "framer-motion";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "../../../../stores/app.store";
import { useAuthStore } from "../../../../stores/auth.store";
import { useCalendarStore } from "../../../../stores/calendar.store";
import { useDockStore } from "../../../../stores/dock.store";
import { useFocusDashboardStore } from "../../../../stores/focus-dashboard.store";
import { useSettingsStore } from "../../../../stores/settings.store";
import { useSiteBlockerStore } from "../../../../stores/site-blocker.store";
import { useSoundscapesStore } from "../../../../stores/soundscapes.store";
import { useTaskStore } from "../../../../stores/task.store";
import { useZenModeStore } from "../../../../stores/zen-mode.store";
import type {
  FocusDashboardState,
  TimerStoreHook,
} from "../focus-dashboard.types";

export const useFocusDashboardState = ({
  timerStore,
}: {
  timerStore: TimerStoreHook;
}): FocusDashboardState => {
  const reduceMotion = useReducedMotion();
  const userId = useAuthStore((state) => state.user?.id);
  const { stage, isRunning, prevRemaining, endTimestamp, durations } =
    timerStore(
      useShallow((state) => ({
        stage: state.stage,
        isRunning: state.isRunning,
        prevRemaining: state.prevRemaining,
        endTimestamp: state.endTimestamp,
        durations: state.durations,
      })),
    );
  const { platform, zenMode } = useAppStore(
    useShallow((state) => ({
      platform: state.platform,
      zenMode: state.zenMode,
    })),
  );
  const {
    tasks,
    initializeTaskStore,
    isTaskStoreLoading,
    hasTaskStoreInitialized,
  } = useTaskStore(
    useShallow((state) => ({
      tasks: state.tasks,
      initializeTaskStore: state.initializeStore,
      isTaskStoreLoading: state.isLoading,
      hasTaskStoreInitialized: state.hasInitialized,
    })),
  );
  const { openSettings, setTab } = useSettingsStore(
    useShallow((state) => ({
      openSettings: state.openSettings,
      setTab: state.setTab,
    })),
  );
  const {
    phase: zenPhase,
    browserCapabilities,
    didStashTabs,
    sessionTaskId: zenSessionTaskId,
    refreshBrowserCapabilities,
    startSession,
    endSession,
    syncSessionFocusState,
  } = useZenModeStore(
    useShallow((state) => ({
      phase: state.phase,
      browserCapabilities: state.browserCapabilities,
      didStashTabs: state.didStashTabs,
      sessionTaskId: state.sessionTaskId,
      refreshBrowserCapabilities: state.refreshBrowserCapabilities,
      startSession: state.startSession,
      endSession: state.endSession,
      syncSessionFocusState: state.syncSessionFocusState,
    })),
  );
  const blockedSiteCount = useSiteBlockerStore(
    useShallow((state) => state.sites.length),
  );
  const playingSounds = useSoundscapesStore(
    useShallow((state) => state.sounds.filter((sound) => sound.playing).length),
  );
  const nextEvent = useCalendarStore(useShallow((state) => state.nextEvent));
  const {
    isTimerVisible,
    toggleTasks,
    toggleSoundscapes,
    toggleSiteBlocker,
    toggleTabStash,
  } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      toggleTasks: state.toggleTasks,
      toggleSoundscapes: state.toggleSoundscapes,
      toggleSiteBlocker: state.toggleSiteBlocker,
      toggleTabStash: state.toggleTabStash,
    })),
  );
  const snapshot = useFocusDashboardStore(
    useShallow((state) => state.snapshot),
  );

  return {
    userId,
    stage,
    isRunning,
    prevRemaining,
    endTimestamp,
    durations,
    platform,
    zenMode,
    tasks,
    initializeTaskStore,
    isTaskStoreLoading,
    hasTaskStoreInitialized,
    openSettings,
    setTab,
    zenPhase,
    browserCapabilities,
    didStashTabs,
    zenSessionTaskId,
    refreshBrowserCapabilities,
    startSession,
    endSession,
    syncSessionFocusState,
    blockedSiteCount,
    playingSounds,
    nextEvent,
    isTimerVisible,
    toggleTasks,
    toggleSoundscapes,
    toggleSiteBlocker,
    toggleTabStash,
    snapshot,
    reduceMotion,
  };
};
