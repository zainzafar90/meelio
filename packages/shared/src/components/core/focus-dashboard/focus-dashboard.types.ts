import type { StoreApi, UseBoundStore } from "zustand";

import type { TimerState } from "../../../types/timer.types";
import type { useAppStore } from "../../../stores/app.store";
import type { useCalendarStore } from "../../../stores/calendar.store";
import type { useDockStore } from "../../../stores/dock.store";
import type { useFocusDashboardStore } from "../../../stores/focus-dashboard.store";
import type { useSettingsStore } from "../../../stores/settings.store";
import type { useTaskStore } from "../../../stores/task.store";
import type { useZenModeStore } from "../../../stores/zen-mode.store";
import type { ZenModeStatusItem } from "./components/zen-mode-status-row";

export type TimerStoreHook = UseBoundStore<StoreApi<TimerState>>;
export type TaskItem = ReturnType<typeof useTaskStore.getState>["tasks"][number];
export type DashboardSnapshot = ReturnType<
  typeof useFocusDashboardStore.getState
>["snapshot"];
export type ZenModePreferences = ReturnType<typeof useAppStore.getState>["zenMode"];
export type BrowserCapabilities = ReturnType<
  typeof useZenModeStore.getState
>["browserCapabilities"];
export type ZenPhase = ReturnType<typeof useZenModeStore.getState>["phase"];

export interface FocusDashboardHomeModeProps {
  calendarPillValue: string | null;
  queuedTaskCountLabel: string;
  focusPillLabel: string;
  focusPillValue: string;
  calendarPillLabel: string;
  tasksPillLabel: string;
  startFocusingLabel: string;
  zenHeadline: string;
  zenSubtitle: string;
  zenStatusItems: ZenModeStatusItem[];
  configureLabel: string;
}

export interface FocusDashboardZenLaunchProps {
  focusPillLabel: string;
  focusPillValue: string;
  startFocusingLabel: string;
  zenHeadline: string;
  zenSubtitle: string;
  zenStatusItems: ZenModeStatusItem[];
  configureLabel: string;
}

export interface FocusDashboardZenModeProps {
  timerEnabled: boolean;
  activeFocusTaskLabel: string;
  activeFocusTaskId: string | null;
  activeFocusTaskEyebrow: string;
  isEmptyState: boolean;
}

export interface FocusDashboardZenSessionControlsProps {
  summaryItems: ZenModeStatusItem[];
  endZenLabel: string;
  configureLabel: string;
}

export interface FocusDashboardState {
  userId: string | undefined;
  stage: TimerState["stage"];
  isRunning: boolean;
  prevRemaining: number | null;
  endTimestamp: number | null;
  durations: TimerState["durations"];
  platform: ReturnType<typeof useAppStore.getState>["platform"];
  zenMode: ZenModePreferences;
  tasks: TaskItem[];
  initializeTaskStore: ReturnType<typeof useTaskStore.getState>["initializeStore"];
  isTaskStoreLoading: boolean;
  hasTaskStoreInitialized: boolean;
  openSettings: ReturnType<typeof useSettingsStore.getState>["openSettings"];
  setTab: ReturnType<typeof useSettingsStore.getState>["setTab"];
  zenPhase: ZenPhase;
  browserCapabilities: BrowserCapabilities;
  didStashTabs: boolean;
  zenSessionTaskId: string | null;
  refreshBrowserCapabilities: ReturnType<
    typeof useZenModeStore.getState
  >["refreshBrowserCapabilities"];
  startSession: ReturnType<typeof useZenModeStore.getState>["startSession"];
  endSession: ReturnType<typeof useZenModeStore.getState>["endSession"];
  syncSessionFocusState: ReturnType<
    typeof useZenModeStore.getState
  >["syncSessionFocusState"];
  blockedSiteCount: number;
  playingSounds: number;
  nextEvent: ReturnType<typeof useCalendarStore.getState>["nextEvent"];
  isTimerVisible: boolean;
  toggleTasks: ReturnType<typeof useDockStore.getState>["toggleTasks"];
  toggleSoundscapes: ReturnType<
    typeof useDockStore.getState
  >["toggleSoundscapes"];
  toggleSiteBlocker: ReturnType<
    typeof useDockStore.getState
  >["toggleSiteBlocker"];
  toggleTabStash: ReturnType<typeof useDockStore.getState>["toggleTabStash"];
  snapshot: DashboardSnapshot;
  reduceMotion: boolean;
}
