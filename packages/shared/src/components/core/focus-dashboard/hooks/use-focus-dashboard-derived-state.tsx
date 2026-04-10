import { useMemo } from "react";
import {
  CheckSquare2,
  PanelsTopLeft,
  Shield,
  Timer,
  Volume2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  FocusDashboardHomeModeProps,
  FocusDashboardState,
  FocusDashboardZenModeProps,
  FocusDashboardZenSessionControlsProps,
} from "../focus-dashboard.types";
import { formatTime } from "../../../../utils/timer.utils";
import {
  getAgendaPillValue,
  getPinnedTask,
  getTaskPillSummary,
  getZenModeStatus,
  selectFocusTasks,
} from "../focus-dashboard.helpers";
import type { FocusModeShellViewModel } from "../components/focus-mode-shell";
import type { ZenModeStatusItem } from "../components/zen-mode-status-row";

const getZenTask = ({
  tasks,
  pinnedTask,
  pinnedTaskSyncEnabled,
  zenSessionTaskId,
}: {
  tasks: FocusDashboardState["tasks"];
  pinnedTask: FocusDashboardState["tasks"][number] | null;
  pinnedTaskSyncEnabled: boolean;
  zenSessionTaskId: string | null;
}) => {
  if (pinnedTaskSyncEnabled) {
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
};

export interface FocusDashboardDerivedState {
  focusTasks: ReturnType<typeof selectFocusTasks>;
  isTaskBootstrapPending: boolean;
  currentTimerLabel: string;
  nextEventLabel: string;
  zenActiveTaskId: string | null;
  showTimerPanel: boolean;
  showZenModeShell: boolean;
  homeModeProps: FocusDashboardHomeModeProps;
  focusModeProps: FocusModeShellViewModel;
  zenModeProps: FocusDashboardZenModeProps;
  zenSessionControlsProps: FocusDashboardZenSessionControlsProps;
}

export const useFocusDashboardDerivedState = (
  state: FocusDashboardState,
): FocusDashboardDerivedState => {
  const { t, i18n } = useTranslation();

  const isTaskBootstrapPending =
    Boolean(state.userId) &&
    (!state.hasTaskStoreInitialized || state.isTaskStoreLoading);
  const focusTasks = useMemo(() => selectFocusTasks(state.tasks), [state.tasks]);
  const pinnedTask = useMemo(() => getPinnedTask(state.tasks), [state.tasks]);
  const taskPillSummary = useMemo(
    () => getTaskPillSummary(state.tasks),
    [state.tasks],
  );
  const timerRemaining = useMemo(() => {
    if (!state.isRunning && state.prevRemaining !== null) {
      return state.prevRemaining;
    }

    if (state.isRunning && state.endTimestamp) {
      return Math.max(0, Math.ceil((state.endTimestamp - Date.now()) / 1000));
    }

    return state.durations[state.stage];
  }, [
    state.durations,
    state.endTimestamp,
    state.isRunning,
    state.prevRemaining,
    state.stage,
  ]);
  const calendarPillValue = useMemo(
    () =>
      getAgendaPillValue(state.nextEvent, {
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
    [i18n.resolvedLanguage, state.nextEvent, t],
  );
  const currentTimerLabel = state.isRunning
    ? t("focusDashboard.timer.remaining", {
        time: formatTime(timerRemaining),
        defaultValue: "{{time}} remaining",
      })
    : t("focusDashboard.timer.ready", {
        defaultValue: "Ready to focus",
      });
  const nextEventLabel = state.nextEvent?.summary
    ? t("focusDashboard.calendar.nextEventLabel", {
        summary: state.nextEvent.summary,
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
  const activeFocusTaskLabel = state.snapshot.activeFocusTaskId
    ? state.snapshot.activeFocusTaskLabel
    : t("focusDashboard.activeTask.empty", {
        defaultValue: "Choose a task to anchor the next focus block",
      });
  const zenTask = useMemo(
    () =>
      getZenTask({
        tasks: state.tasks,
        pinnedTask,
        pinnedTaskSyncEnabled: state.zenMode.pinnedTaskSyncEnabled,
        zenSessionTaskId: state.zenSessionTaskId,
      }),
    [
      pinnedTask,
      state.tasks,
      state.zenMode.pinnedTaskSyncEnabled,
      state.zenSessionTaskId,
    ],
  );
  const zenActiveTaskId = zenTask?.id ?? state.zenSessionTaskId;
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
    state.zenPhase === "starting"
      ? t("focusDashboard.zenMode.starting", {
          defaultValue: "Entering Zen...",
        })
      : t("focusDashboard.zenMode.start", {
          defaultValue: "Enter Zen",
        });
  const zenEndLabel =
    state.zenPhase === "ending"
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
          enabled: state.zenMode.timerEnabled,
          readyValue: zenStatusReadyLabel,
          activeValue: currentTimerLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <CheckSquare2 className="size-3.5" />,
        label: tasksPillLabel,
        ...getZenModeStatus({
          enabled: state.zenMode.pinnedTaskSyncEnabled,
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
          enabled: state.zenMode.soundscapesEnabled,
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
          enabled: state.zenMode.siteBlockerEnabled,
          availability: state.browserCapabilities.siteBlocker,
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
          enabled: state.zenMode.tabStashEnabled,
          availability: state.browserCapabilities.tabStash,
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
    ],
    [
      currentTimerLabel,
      focusPillLabel,
      pinnedTask?.title,
      state.browserCapabilities.siteBlocker,
      state.browserCapabilities.tabStash,
      state.zenMode.pinnedTaskSyncEnabled,
      state.zenMode.siteBlockerEnabled,
      state.zenMode.soundscapesEnabled,
      state.zenMode.tabStashEnabled,
      state.zenMode.timerEnabled,
      t,
      tasksPillLabel,
      zenActiveTaskLabel,
      zenStatusActiveLabel,
      zenStatusLabels,
      zenStatusReadyLabel,
    ],
  );

  const zenModuleSummaryItems = useMemo<ZenModeStatusItem[]>(
    () => [
      {
        icon: <Volume2 className="size-3" />,
        label: t("common.soundscapes", { defaultValue: "Soundscapes" }),
        onClick: state.toggleSoundscapes,
        ...getZenModeStatus({
          enabled: state.zenMode.soundscapesEnabled,
          isActive: state.playingSounds > 0,
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <Shield className="size-3" />,
        label: t("common.site-blocker", { defaultValue: "Site Blocker" }),
        onClick: state.toggleSiteBlocker,
        ...getZenModeStatus({
          enabled: state.zenMode.siteBlockerEnabled,
          availability: state.browserCapabilities.siteBlocker,
          isActive:
            state.zenPhase !== "inactive" &&
            state.zenMode.siteBlockerEnabled &&
            state.browserCapabilities.siteBlocker === "ready",
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
      {
        icon: <PanelsTopLeft className="size-3" />,
        label: t("common.tab-stash", { defaultValue: "Tab Stash" }),
        onClick: state.toggleTabStash,
        ...getZenModeStatus({
          enabled: state.zenMode.tabStashEnabled,
          availability: state.browserCapabilities.tabStash,
          isStashed: state.didStashTabs,
          readyValue: zenStatusReadyLabel,
          activeValue: zenStatusActiveLabel,
          labels: zenStatusLabels,
        }),
      },
    ],
    [
      state.browserCapabilities.siteBlocker,
      state.browserCapabilities.tabStash,
      state.didStashTabs,
      state.playingSounds,
      state.toggleSiteBlocker,
      state.toggleSoundscapes,
      state.toggleTabStash,
      state.zenMode.siteBlockerEnabled,
      state.zenMode.soundscapesEnabled,
      state.zenMode.tabStashEnabled,
      state.zenPhase,
      t,
      zenStatusActiveLabel,
      zenStatusLabels,
      zenStatusReadyLabel,
    ],
  );

  return {
    focusTasks,
    isTaskBootstrapPending,
    currentTimerLabel,
    nextEventLabel,
    zenActiveTaskId,
    showTimerPanel: state.zenPhase !== "inactive" || state.isTimerVisible || state.isRunning,
    showZenModeShell: state.zenPhase !== "inactive",
    homeModeProps: {
      calendarPillValue,
      queuedTaskCountLabel,
      focusPillLabel: zenReadyLabel,
      focusPillValue: zenStartLabel,
      calendarPillLabel,
      tasksPillLabel,
      startFocusingLabel: zenStartLabel,
      zenHeadline: zenReadyHeadline,
      zenSubtitle: zenReadySubtitle,
      zenStatusItems: zenReadyItems,
      configureLabel: zenConfigureLabel,
    },
    focusModeProps: {
      topPills: {
        currentTimerLabel,
        completedTaskCountLabel,
        calendarPillValue,
        focusPillLabel,
        calendarPillLabel,
        todayPillLabel,
      },
      taskHeading: {
        activeFocusTaskLabel,
        activeFocusTaskId: state.snapshot.activeFocusTaskId,
        activeFocusTaskEyebrow,
      },
    },
    zenModeProps: {
      timerEnabled: state.zenMode.timerEnabled,
      activeFocusTaskLabel: zenActiveTaskLabel,
      activeFocusTaskId: zenActiveTaskId,
    },
    zenSessionControlsProps: {
      summaryItems: zenModuleSummaryItems,
      endZenLabel: zenEndLabel,
      configureLabel: zenConfigureLabel,
    },
  };
};
