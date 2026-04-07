import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { StoreApi, UseBoundStore } from "zustand";
import { useShallow } from "zustand/shallow";
import {
  Brain,
  CalendarDays,
  CheckSquare2,
  PanelsTopLeft,
  Settings2,
  Shield,
  Timer,
  Volume2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TimerState } from "../../../types/timer.types";
import { formatTime } from "../../../utils/timer.utils";
import { getMinutesUntilEvent } from "../../../utils/calendar-date.utils";
import { useAppStore } from "../../../stores/app.store";
import { useCalendarStore } from "../../../stores/calendar.store";
import { useDockStore } from "../../../stores/dock.store";
import {
  initializeFocusDashboardStore,
  syncFocusDashboardSignals,
  updateDailyFocusPlan,
  useFocusDashboardStore,
} from "../../../stores/focus-dashboard.store";
import { useAuthStore } from "../../../stores/auth.store";
import { useSettingsStore } from "../../../stores/settings.store";
import { useSiteBlockerStore } from "../../../stores/site-blocker.store";
import { useSoundscapesStore } from "../../../stores/soundscapes.store";
import { useTaskStore } from "../../../stores/task.store";
import { useZenModeStore } from "../../../stores/zen-mode.store";
import { Clock } from "../clock";
import { Greeting } from "../greetings/greetings-mantras";
import { ZenModeConfigTrigger } from "./components/zen-mode-config-trigger";
import {
  ZenModeStatusSummary,
  type ZenModeStatusItem,
} from "./components/zen-mode-status-row";
import {
  getAgendaPillValue,
  getTaskPillSummary,
  getZenModeStatus,
} from "./focus-dashboard.helpers";

type TimerStoreHook = UseBoundStore<StoreApi<TimerState>>;

interface FocusDashboardProps {
  timerStore: TimerStoreHook;
  timerPanel: ReactNode;
}

const selectFocusTasks = (
  tasks: Array<{
    id: string;
    title: string;
    completed?: boolean;
    pinned?: boolean;
    deletedAt?: number | null;
    updatedAt?: number;
  }>,
) =>
  tasks
    .filter((task) => !task.completed && !task.deletedAt)
    .sort((left, right) => {
      if (Boolean(left.pinned) !== Boolean(right.pinned)) {
        return left.pinned ? -1 : 1;
      }

      return (right.updatedAt ?? 0) - (left.updatedAt ?? 0);
    })
    .slice(0, 3)
    .map((task) => ({
      id: task.id,
      title: task.title,
      completed: false,
      pinned: Boolean(task.pinned),
    }));

export const FocusDashboard = ({
  timerStore,
  timerPanel,
}: FocusDashboardProps) => {
  const { t, i18n } = useTranslation();
  const userId = useAuthStore((state) => state.user?.id);
  const { stage, isRunning, prevRemaining, endTimestamp, durations } =
    timerStore(
      useShallow((state) => ({
        stage: state.stage,
        isRunning: state.isRunning,
        prevRemaining: state.prevRemaining,
        endTimestamp: state.endTimestamp,
        durations: state.durations,
        start: state.start,
        reset: state.reset,
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
  const blockedSites = useSiteBlockerStore(useShallow((state) => state.sites));
  const playingSounds = useSoundscapesStore(
    useShallow((state) => state.sounds.filter((sound) => sound.playing).length),
  );
  const nextEvent = useCalendarStore(useShallow((state) => state.nextEvent));
  const { isTimerVisible, toggleTasks } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      toggleTasks: state.toggleTasks,
    })),
  );
  const snapshot = useFocusDashboardStore(
    useShallow((state) => state.snapshot),
  );
  const reduceMotion = useReducedMotion();
  const isTaskBootstrapPending =
    Boolean(userId) && (!hasTaskStoreInitialized || isTaskStoreLoading);

  const focusTasks = useMemo(() => selectFocusTasks(tasks), [tasks]);
  const pinnedTask = useMemo(
    () =>
      tasks
        .filter((task) => !task.completed && !task.deletedAt && task.pinned)
        .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))[0] ??
      null,
    [tasks],
  );
  const taskPillSummary = useMemo(() => getTaskPillSummary(tasks), [tasks]);
  const timerRemaining = useMemo(() => {
    if (!isRunning && prevRemaining !== null) {
      return prevRemaining;
    }

    if (isRunning && endTimestamp) {
      return Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
    }

    return durations[stage];
  }, [durations, endTimestamp, isRunning, prevRemaining, stage]);
  const calendarPillValue = useMemo(
    () =>
      getAgendaPillValue(nextEvent, {
        noUpcomingEvent: t("focusDashboard.calendar.noUpcomingEvent", {
          defaultValue: "No upcoming event",
        }),
        allDayEvent: t("focusDashboard.calendar.allDayEvent", {
          defaultValue: "All-day event",
        }),
        upcomingEvent: t("focusDashboard.calendar.upcomingEvent", {
          defaultValue: "Upcoming event",
        }),
      }),
    [i18n.resolvedLanguage, nextEvent, t],
  );
  const currentTimerLabel = isRunning
    ? t("focusDashboard.timer.remaining", {
        time: formatTime(timerRemaining),
        defaultValue: "{{time}} remaining",
      })
    : t("focusDashboard.timer.ready", {
        defaultValue: "Ready to focus",
      });
  const nextEventLabel = nextEvent?.summary
    ? t("focusDashboard.calendar.nextEventLabel", {
        summary: nextEvent.summary,
        defaultValue: "Next: {{summary}}",
      })
    : "";
  const queuedTaskCountLabel = t("focusDashboard.tasks.queuedCount", {
    count: taskPillSummary.queuedCount,
    defaultValue: "{{count}} queued",
  });
  const completedTaskCountLabel = t("focusDashboard.tasks.doneCount", {
    count: taskPillSummary.completedCount,
    defaultValue: "{{count}} done",
  });
  const activeFocusTaskLabel = snapshot.activeFocusTaskId
    ? snapshot.activeFocusTaskLabel
    : t("focusDashboard.activeTask.empty", {
        defaultValue: "Choose a task to anchor the next focus block",
      });
  const zenTask = useMemo(() => {
    if (zenMode.pinnedTaskSyncEnabled) {
      return pinnedTask;
    }

    if (!zenSessionTaskId) {
      return null;
    }

    return (
      tasks.find(
        (task) =>
          task.id === zenSessionTaskId && !task.completed && !task.deletedAt,
      ) ?? null
    );
  }, [pinnedTask, tasks, zenMode.pinnedTaskSyncEnabled, zenSessionTaskId]);
  const zenActiveTaskId = zenTask?.id ?? zenSessionTaskId;
  const zenActiveTaskLabel = zenTask?.title ?? activeFocusTaskLabel;
  const focusPillLabel = t("timer.controls.focusLabel", {
    defaultValue: "Focus",
  });
  const calendarPillLabel = t("common.calendar", {
    defaultValue: "Calendar",
  });
  const tasksPillLabel = t("common.tasks", {
    defaultValue: "Tasks",
  });
  const todayPillLabel = t("calendar.sheet.today", {
    defaultValue: "Today",
  });
  const activeFocusTaskEyebrow = t("focusDashboard.activeTask.label", {
    defaultValue: "Active Focus Task",
  });
  const zenReadyLabel = t("focusDashboard.zenMode.readyLabel", {
    defaultValue: "Zen Mode",
  });
  const zenReadyHeadline = t("focusDashboard.zenMode.readyHeadline", {
    defaultValue: "One tap enters your focus ritual",
  });
  const zenReadySubtitle = t("focusDashboard.zenMode.readySubtitle", {
    defaultValue:
      "Timer, tasks, soundscapes, blocker, and tabs follow your saved defaults.",
  });
  const zenConfigureLabel = t("focusDashboard.zenMode.configure", {
    defaultValue: "Configure",
  });
  const zenStartLabel =
    zenPhase === "starting"
      ? t("focusDashboard.zenMode.starting", {
          defaultValue: "Entering Zen...",
        })
      : t("focusDashboard.zenMode.start", {
          defaultValue: "Enter Zen",
        });
  const zenEndLabel =
    zenPhase === "ending"
      ? t("focusDashboard.zenMode.ending", {
          defaultValue: "Leaving Zen...",
        })
      : t("focusDashboard.zenMode.end", {
          defaultValue: "End Zen",
        });
  const zenStatusReadyLabel = t("focusDashboard.zenMode.status.ready", {
    defaultValue: "Ready",
  });
  const zenStatusActiveLabel = t("focusDashboard.zenMode.status.active", {
    defaultValue: "Active",
  });
  const zenStatusLabels = {
    off: t("focusDashboard.zenMode.status.off", {
      defaultValue: "Off",
    }),
    unavailable: t("focusDashboard.zenMode.status.unavailable", {
      defaultValue: "Extension only",
    }),
    permissionNeeded: t("focusDashboard.zenMode.status.permissionNeeded", {
      defaultValue: "Permission needed",
    }),
    stashed: t("focusDashboard.zenMode.status.stashed", {
      defaultValue: "Stashed",
    }),
  };

  const zenReadyItems = useMemo<ZenModeStatusItem[]>(
    () => [
      {
        icon: <Timer className="size-3.5" />,
        label: focusPillLabel,
        ...getZenModeStatus({
          enabled: zenMode.timerEnabled,
          readyValue: zenStatusReadyLabel,
          activeValue: currentTimerLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <CheckSquare2 className="size-3.5" />,
        label: tasksPillLabel,
        ...getZenModeStatus({
          enabled: zenMode.pinnedTaskSyncEnabled,
          readyValue: pinnedTask?.title ?? zenStatusReadyLabel,
          activeValue: zenActiveTaskLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <Volume2 className="size-3.5" />,
        label: t("common.soundscapes", {
          defaultValue: "Soundscapes",
        }),
        ...getZenModeStatus({
          enabled: zenMode.soundscapesEnabled,
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <Shield className="size-3.5" />,
        label: t("common.site-blocker", {
          defaultValue: "Site Blocker",
        }),
        ...getZenModeStatus({
          enabled: zenMode.siteBlockerEnabled,
          availability: browserCapabilities.siteBlocker,
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <PanelsTopLeft className="size-3.5" />,
        label: t("common.tab-stash", {
          defaultValue: "Tab Stash",
        }),
        ...getZenModeStatus({
          enabled: zenMode.tabStashEnabled,
          availability: browserCapabilities.tabStash,
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
    ],
    [
      browserCapabilities.siteBlocker,
      browserCapabilities.tabStash,
      currentTimerLabel,
      focusPillLabel,
      pinnedTask?.title,
      tasksPillLabel,
      t,
      zenActiveTaskLabel,
      zenMode.pinnedTaskSyncEnabled,
      zenMode.siteBlockerEnabled,
      zenMode.soundscapesEnabled,
      zenMode.tabStashEnabled,
      zenMode.timerEnabled,
      zenStatusActiveLabel,
      zenStatusLabels,
      zenStatusReadyLabel,
    ],
  );

  const zenActiveItems = useMemo<ZenModeStatusItem[]>(
    () => [
      {
        icon: <Timer className="size-3.5" />,
        label: focusPillLabel,
        ...getZenModeStatus({
          enabled: zenMode.timerEnabled,
          isActive: zenPhase !== "inactive" && zenMode.timerEnabled,
          readyValue: zenStatusReadyLabel,
          activeValue: currentTimerLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <CheckSquare2 className="size-3.5" />,
        label: tasksPillLabel,
        ...getZenModeStatus({
          enabled: zenMode.pinnedTaskSyncEnabled,
          isActive: Boolean(zenActiveTaskId),
          readyValue: pinnedTask?.title ?? zenStatusReadyLabel,
          activeValue: zenActiveTaskLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <Volume2 className="size-3.5" />,
        label: t("common.soundscapes", {
          defaultValue: "Soundscapes",
        }),
        ...getZenModeStatus({
          enabled: zenMode.soundscapesEnabled,
          isActive: playingSounds > 0,
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <Shield className="size-3.5" />,
        label: t("common.site-blocker", {
          defaultValue: "Site Blocker",
        }),
        ...getZenModeStatus({
          enabled: zenMode.siteBlockerEnabled,
          availability: browserCapabilities.siteBlocker,
          isActive:
            zenPhase !== "inactive" &&
            zenMode.siteBlockerEnabled &&
            browserCapabilities.siteBlocker === "ready",
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <PanelsTopLeft className="size-3.5" />,
        label: t("common.tab-stash", {
          defaultValue: "Tab Stash",
        }),
        ...getZenModeStatus({
          enabled: zenMode.tabStashEnabled,
          availability: browserCapabilities.tabStash,
          isStashed: didStashTabs,
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
    ],
    [
      browserCapabilities.siteBlocker,
      browserCapabilities.tabStash,
      currentTimerLabel,
      didStashTabs,
      focusPillLabel,
      pinnedTask?.title,
      playingSounds,
      t,
      tasksPillLabel,
      zenActiveTaskId,
      zenActiveTaskLabel,
      zenMode.pinnedTaskSyncEnabled,
      zenMode.siteBlockerEnabled,
      zenMode.soundscapesEnabled,
      zenMode.tabStashEnabled,
      zenMode.timerEnabled,
      zenPhase,
      zenStatusActiveLabel,
      zenStatusLabels,
      zenStatusReadyLabel,
    ],
  );

  useEffect(() => {
    initializeFocusDashboardStore();
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void initializeTaskStore();
  }, [initializeTaskStore, userId]);

  useEffect(() => {
    if (isTaskBootstrapPending) {
      return;
    }

    updateDailyFocusPlan({ topTasks: focusTasks });
  }, [focusTasks, isTaskBootstrapPending]);

  useEffect(() => {
    void refreshBrowserCapabilities();
  }, [
    platform,
    refreshBrowserCapabilities,
    zenMode.siteBlockerEnabled,
    zenMode.tabStashEnabled,
  ]);

  useEffect(() => {
    syncFocusDashboardSignals({
      timerRunning: isRunning,
      timerStage: stage,
      timerLabel: currentTimerLabel,
      sessionFocusTaskId:
        zenPhase !== "inactive"
          ? zenActiveTaskId ?? null
          : isRunning
            ? snapshot.sessionFocusTaskId
            : null,
      blockerMode:
        zenPhase !== "inactive" &&
        zenMode.siteBlockerEnabled &&
        browserCapabilities.siteBlocker === "ready"
          ? "active"
          : blockedSites.length > 0 && isRunning
            ? "active"
            : "ready",
      soundtrackMode: playingSounds > 0 ? "playing" : "available",
      nextEventLabel,
      minutesUntilEvent: nextEvent ? getMinutesUntilEvent(nextEvent) : null,
    });
  }, [
    blockedSites.length,
    currentTimerLabel,
    nextEventLabel,
    isRunning,
    nextEvent,
    playingSounds,
    zenActiveTaskId,
    zenMode.siteBlockerEnabled,
    browserCapabilities.siteBlocker,
    zenPhase,
    stage,
    timerRemaining,
  ]);

  useEffect(() => {
    void syncSessionFocusState({
      isRunning,
      stage,
    });
  }, [
    browserCapabilities.siteBlocker,
    isRunning,
    stage,
    syncSessionFocusState,
    zenMode.siteBlockerEnabled,
    zenPhase,
  ]);

  const handleConfigureZenMode = () => {
    setTab("general");
    openSettings();
  };

  const handleStartZenMode = () => {
    void startSession({
      isRunning,
      stage,
      start: timerStore.getState().start,
      reset: timerStore.getState().reset,
    });
  };

  const handleEndZenMode = () => {
    void endSession({
      isRunning,
      stage,
      start: timerStore.getState().start,
      reset: timerStore.getState().reset,
    });
  };

  const showTimerPanel = zenPhase !== "inactive" || isTimerVisible || isRunning;
  const showZenModeShell = zenPhase !== "inactive";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-2 pb-2 pt-2 sm:px-4">
      <AnimatePresence mode="wait" initial={false}>
        {showTimerPanel ? (
          <motion.div
            key="focus-mode"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, filter: "blur(10px)" }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -12, filter: "blur(8px)" }
            }
            transition={{
              duration: reduceMotion ? 0.18 : 0.3,
              ease: "easeOut",
            }}
            className="flex min-h-0 flex-1"
          >
            {showZenModeShell ? (
              <ZenModeShell
                timerPanel={timerPanel}
                timerEnabled={zenMode.timerEnabled}
                currentTimerLabel={currentTimerLabel}
                activeFocusTaskLabel={zenActiveTaskLabel}
                activeFocusTaskId={zenActiveTaskId}
                statusItems={zenActiveItems}
                endZenLabel={zenEndLabel}
                configureLabel={zenConfigureLabel}
                onEndZen={handleEndZenMode}
                onConfigure={handleConfigureZenMode}
                onSelectTask={toggleTasks}
              />
            ) : (
              <FocusModeShell
                timerPanel={timerPanel}
                currentTimerLabel={currentTimerLabel}
                activeFocusTaskLabel={activeFocusTaskLabel}
                activeFocusTaskId={snapshot.activeFocusTaskId}
                completedTaskCountLabel={completedTaskCountLabel}
                calendarPillValue={calendarPillValue}
                focusPillLabel={focusPillLabel}
                calendarPillLabel={calendarPillLabel}
                todayPillLabel={todayPillLabel}
                activeFocusTaskEyebrow={activeFocusTaskEyebrow}
                onSelectTask={toggleTasks}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="home-mode"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 14, filter: "blur(10px)" }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -10, filter: "blur(8px)" }
            }
            transition={{
              duration: reduceMotion ? 0.18 : 0.28,
              ease: "easeOut",
            }}
            className="flex min-h-0 flex-1"
          >
            <HomeModeShell
              calendarPillValue={calendarPillValue}
              queuedTaskCountLabel={queuedTaskCountLabel}
              focusPillLabel={zenReadyLabel}
              calendarPillLabel={calendarPillLabel}
              tasksPillLabel={tasksPillLabel}
              startFocusingLabel={zenStartLabel}
              zenHeadline={zenReadyHeadline}
              zenSubtitle={zenReadySubtitle}
              zenStatusItems={zenReadyItems}
              configureLabel={zenConfigureLabel}
              onConfigure={handleConfigureZenMode}
              onStartFocusing={handleStartZenMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomeModeShell = ({
  calendarPillValue,
  queuedTaskCountLabel,
  focusPillLabel,
  calendarPillLabel,
  tasksPillLabel,
  startFocusingLabel,
  zenHeadline,
  zenSubtitle,
  zenStatusItems,
  configureLabel,
  onConfigure,
  onStartFocusing,
}: {
  calendarPillValue: string | null;
  queuedTaskCountLabel: string;
  focusPillLabel: string;
  calendarPillLabel: string;
  tasksPillLabel: string;
  startFocusingLabel: string;
  zenHeadline: string;
  zenSubtitle: string;
  zenStatusItems: ZenModeStatusItem[];
  configureLabel: string;
  onConfigure: () => void;
  onStartFocusing: () => void;
}) => (
  <div className="relative flex min-h-0 flex-1 flex-col">
    <div className="absolute inset-x-0 top-0 z-10 hidden items-start justify-between gap-3 px-4 py-3 [@media(min-height:580px)]:flex">
      <div className="flex-1" />
      <div className="flex-1 flex justify-center">
        {calendarPillValue && (
          <AmbientPill
            icon={<CalendarDays className="size-3.5" />}
            label={calendarPillLabel}
            value={calendarPillValue}
          />
        )}
      </div>
      <div className="flex-1 flex justify-end">
        <AmbientPill
          icon={<CheckSquare2 className="size-3.5" />}
          label={tasksPillLabel}
          value={queuedTaskCountLabel}
        />
      </div>
    </div>

    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-28 text-center sm:pb-32">
      <div className="max-w-5xl space-y-6">
        <Clock />
        <div className="space-y-2">
          <div className="[&_h2]:mb-0 [&_h2]:mt-0 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight sm:[&_h2]:text-3xl md:[&_h2]:text-4xl">
            <Greeting />
          </div>
        </div>
      </div>
    </div>

    <ZenLaunchRail
      focusPillLabel={focusPillLabel}
      startFocusingLabel={startFocusingLabel}
      zenHeadline={zenHeadline}
      zenSubtitle={zenSubtitle}
      zenStatusItems={zenStatusItems}
      configureLabel={configureLabel}
      onConfigure={onConfigure}
      onStartFocusing={onStartFocusing}
    />
  </div>
);

const FocusModeShell = ({
  timerPanel,
  currentTimerLabel,
  activeFocusTaskLabel,
  activeFocusTaskId,
  completedTaskCountLabel,
  calendarPillValue,
  focusPillLabel,
  calendarPillLabel,
  todayPillLabel,
  activeFocusTaskEyebrow,
  onSelectTask,
}: {
  timerPanel: ReactNode;
  currentTimerLabel: string;
  activeFocusTaskLabel: string;
  activeFocusTaskId: string | null;
  completedTaskCountLabel: string;
  calendarPillValue: string | null;
  focusPillLabel: string;
  calendarPillLabel: string;
  todayPillLabel: string;
  activeFocusTaskEyebrow: string;
  onSelectTask: () => void;
}) => (
  <div className="relative flex min-h-0 flex-1 items-center justify-center">
    <div className="pointer-events-none absolute inset-0 bg-black/7 backdrop-blur-[8px]" />
    <div className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_18%),radial-gradient(circle_at_center,rgba(0,0,0,0.20),transparent_58%),linear-gradient(to_bottom,rgba(0,0,0,0.13),transparent_28%)]" />
    <div className="relative flex h-full w-full max-w-full flex-col">
      <div className="hidden items-center justify-between px-4 py-3 [@media(min-height:580px)]:flex">
        <div className="flex-1 flex justify-start">
          <AmbientPill
            icon={<Timer className="size-3.5" />}
            label={focusPillLabel}
            value={currentTimerLabel}
          />
        </div>
        <div className="flex-1 flex justify-center">
          {calendarPillValue && (
            <AmbientPill
              icon={<CalendarDays className="size-3.5" />}
              label={calendarPillLabel}
              value={calendarPillValue}
            />
          )}
        </div>
        <div className="flex-1 flex justify-end">
          <AmbientPill
            icon={<CheckSquare2 className="size-3.5" />}
            label={todayPillLabel}
            value={completedTaskCountLabel}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-4 pb-6">
        <div
          className="cursor-default space-y-3 text-center"
          onClick={activeFocusTaskId ? undefined : onSelectTask}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/62">
            {activeFocusTaskEyebrow}
          </p>
          <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.16)] sm:text-4xl">
            {activeFocusTaskLabel}
          </h2>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.28, ease: "easeOut", delay: 0.04 }}
          className="w-full"
        >
          {timerPanel}
        </motion.div>
      </div>
    </div>
  </div>
);

const ZenModeShell = ({
  timerPanel,
  timerEnabled,
  currentTimerLabel,
  activeFocusTaskLabel,
  activeFocusTaskId,
  statusItems,
  endZenLabel,
  configureLabel,
  onEndZen,
  onConfigure,
  onSelectTask,
}: {
  timerPanel: ReactNode;
  timerEnabled: boolean;
  currentTimerLabel: string;
  activeFocusTaskLabel: string;
  activeFocusTaskId: string | null | undefined;
  statusItems: ZenModeStatusItem[];
  endZenLabel: string;
  configureLabel: string;
  onEndZen: () => void;
  onConfigure: () => void;
  onSelectTask: () => void;
}) => (
  <div className="relative flex min-h-0 flex-1 items-center justify-center">
    <div className="pointer-events-none absolute inset-0 bg-black/12 backdrop-blur-[10px]" />
    <div className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_center,rgba(0,0,0,0.22),transparent_58%),linear-gradient(to_bottom,rgba(0,0,0,0.16),transparent_28%)]" />
    <div className="relative flex h-full w-full max-w-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 pt-6">
        <div className="max-w-5xl text-center">
          <h2
            className="cursor-default text-balance text-3xl font-semibold tracking-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.16)] sm:text-4xl lg:text-5xl"
            onClick={activeFocusTaskId ? undefined : onSelectTask}
          >
            {activeFocusTaskLabel}
          </h2>
        </div>
        {timerEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ duration: 0.28, ease: "easeOut", delay: 0.04 }}
            className="w-full"
          >
            {timerPanel}
          </motion.div>
        )}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onConfigure}
              className="inline-flex size-9 items-center justify-center rounded-full text-white/50 transition-opacity duration-200 hover:text-white/90"
              aria-label={configureLabel}
            >
              <Settings2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={onEndZen}
              className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/50 transition-opacity duration-200 hover:text-white/90"
            >
              <Brain className="size-3.5" />
              <span>{endZenLabel}</span>
            </button>
          </div>
          <ZenModeStatusSummary items={statusItems} />
        </div>
      </div>
    </div>
  </div>
);

const ZenLaunchRail = ({
  focusPillLabel,
  startFocusingLabel,
  zenHeadline,
  zenSubtitle,
  zenStatusItems,
  configureLabel,
  onConfigure,
  onStartFocusing,
}: {
  focusPillLabel: string;
  startFocusingLabel: string;
  zenHeadline: string;
  zenSubtitle: string;
  zenStatusItems: ZenModeStatusItem[];
  configureLabel: string;
  onConfigure: () => void;
  onStartFocusing: () => void;
}) => (
  <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-4 sm:bottom-4">
    <div className="pointer-events-auto w-full max-w-3xl rounded-[30px] bg-white/10 px-4 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-2xl sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/52">
            {focusPillLabel}
          </p>
          <h2 className="text-balance text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {zenHeadline}
          </h2>
          <p className="max-w-2xl text-sm text-white/66 sm:text-[15px]">
            {zenSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-end">
          <ZenModeConfigTrigger label={configureLabel} onClick={onConfigure} />
          <ZenPrimaryAction label={startFocusingLabel} onClick={onStartFocusing} />
        </div>
      </div>
      <ZenModeStatusSummary items={zenStatusItems} className="mt-3 text-left sm:mt-4" />
    </div>
  </div>
);

const AmbientPill = ({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) => (
  <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/16 px-3.5 text-sm text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl sm:h-10 sm:gap-3 sm:px-5">
    {icon && <span className="text-white/88">{icon}</span>}
    <span className="hidden md:inline text-[11px] font-medium uppercase tracking-[0.28em] text-white/68">
      {label}
    </span>
    <span className="truncate max-w-[86px] text-xs font-semibold text-white [text-shadow:_0_1px_8px_rgba(0,0,0,0.18)] sm:max-w-[132px] sm:text-sm">
      {value}
    </span>
  </div>
);

const ZenPrimaryAction = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-zinc-950 shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:-translate-y-0.5 sm:h-10 sm:px-5"
  >
    <Brain className="size-3.5" />
    <span>{label}</span>
  </button>
);
