import { useCallback, useEffect, useRef, useState } from "react";

import {
  initializeFocusDashboardStore,
  syncFocusDashboardSignals,
  updateDailyFocusPlan,
} from "../../../../stores/focus-dashboard.store";
import { getMinutesUntilEvent } from "../../../../utils/calendar-date.utils";
import type { FocusDashboardState, TimerStoreHook } from "../focus-dashboard.types";
import type { FocusDashboardDerivedState } from "./use-focus-dashboard-derived-state";

export const useFocusDashboardEffects = ({
  state,
  derived,
  timerStore,
}: {
  state: FocusDashboardState;
  derived: FocusDashboardDerivedState;
  timerStore: TimerStoreHook;
}) => {
  const [zenWindowFocused, setZenWindowFocused] = useState(() =>
    typeof document === "undefined"
      ? true
      : document.visibilityState === "visible" && document.hasFocus(),
  );

  const latestIsRunning = useRef(state.isRunning);
  const latestStage = useRef(state.stage);
  useEffect(() => {
    latestIsRunning.current = state.isRunning;
  }, [state.isRunning]);
  useEffect(() => {
    latestStage.current = state.stage;
  }, [state.stage]);

  useEffect(() => {
    initializeFocusDashboardStore();
  }, []);

  useEffect(() => {
    if (!state.userId) {
      return;
    }

    void state.initializeTaskStore();
  }, [state.initializeTaskStore, state.userId]);

  useEffect(() => {
    if (derived.isTaskBootstrapPending) {
      return;
    }

    updateDailyFocusPlan({ topTasks: derived.focusTasks });
  }, [derived.focusTasks, derived.isTaskBootstrapPending]);

  useEffect(() => {
    void state.refreshBrowserCapabilities();
  }, [
    state.platform,
    state.refreshBrowserCapabilities,
    state.zenMode.siteBlockerEnabled,
    state.zenMode.tabStashEnabled,
  ]);

  useEffect(() => {
    syncFocusDashboardSignals({
      timerRunning: state.isRunning,
      timerStage: state.stage,
      timerLabel: derived.currentTimerLabel,
      sessionFocusTaskId:
        state.zenPhase !== "inactive"
          ? derived.zenActiveTaskId ?? null
          : state.isRunning
            ? state.snapshot.sessionFocusTaskId
            : null,
      blockerMode:
        state.zenPhase !== "inactive" &&
        state.zenMode.siteBlockerEnabled &&
        state.browserCapabilities.siteBlocker === "ready"
          ? "active"
          : state.blockedSiteCount > 0 && state.isRunning
            ? "active"
            : "ready",
      soundtrackMode: state.playingSounds > 0 ? "playing" : "available",
      nextEventLabel: derived.nextEventLabel,
      minutesUntilEvent: state.nextEvent
        ? getMinutesUntilEvent(state.nextEvent)
        : null,
    });
  }, [
    state.blockedSiteCount,
    state.browserCapabilities.siteBlocker,
    derived.currentTimerLabel,
    state.isRunning,
    state.nextEvent,
    derived.nextEventLabel,
    state.playingSounds,
    state.snapshot.sessionFocusTaskId,
    state.stage,
    derived.zenActiveTaskId,
    state.zenMode.siteBlockerEnabled,
    state.zenPhase,
  ]);

  useEffect(() => {
    void state.syncSessionFocusState({
      isRunning: state.isRunning,
      stage: state.stage,
    });
  }, [
    state.browserCapabilities.siteBlocker,
    state.isRunning,
    state.stage,
    state.syncSessionFocusState,
    state.zenMode.siteBlockerEnabled,
    state.zenPhase,
  ]);

  useEffect(() => {
    if (state.zenPhase === "inactive") {
      return;
    }

    const syncZenWindowFocus = () => {
      setZenWindowFocused(
        document.visibilityState === "visible" && document.hasFocus(),
      );
    };

    syncZenWindowFocus();
    window.addEventListener("focus", syncZenWindowFocus);
    window.addEventListener("blur", syncZenWindowFocus);
    document.addEventListener("visibilitychange", syncZenWindowFocus);

    return () => {
      window.removeEventListener("focus", syncZenWindowFocus);
      window.removeEventListener("blur", syncZenWindowFocus);
      document.removeEventListener("visibilitychange", syncZenWindowFocus);
    };
  }, [state.zenPhase]);

  const handleConfigureZenMode = useCallback(() => {
    state.setTab("general");
    state.openSettings();
  }, [state.openSettings, state.setTab]);

  const handleStartZenMode = useCallback(() => {
    void state.startSession({
      isRunning: latestIsRunning.current,
      stage: latestStage.current,
      start: timerStore.getState().start,
      reset: timerStore.getState().reset,
    });
  }, [state.startSession, timerStore]);

  const handleEndZenMode = useCallback(() => {
    void state.endSession({
      isRunning: latestIsRunning.current,
      stage: latestStage.current,
      start: timerStore.getState().start,
      reset: timerStore.getState().reset,
    });
  }, [state.endSession, timerStore]);

  return {
    zenWindowFocused,
    handleConfigureZenMode,
    handleStartZenMode,
    handleEndZenMode,
  };
};
