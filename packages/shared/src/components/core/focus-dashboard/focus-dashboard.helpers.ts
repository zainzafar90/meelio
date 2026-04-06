import type { CalendarEvent } from "../../../types/calendar.types";
import { isAllDayEvent } from "../../../utils/calendar-date.utils";

type FocusTaskLike = {
  completed?: boolean;
  deletedAt?: number | null;
};

type AgendaPillLabels = {
  noUpcomingEvent: string;
  allDayEvent: string;
  upcomingEvent: string;
};

export type ZenModeStatusTone =
  | "ready"
  | "active"
  | "off"
  | "warning"
  | "unavailable";

type ZenModeStatusLabels = {
  off: string;
  unavailable: string;
  permissionNeeded: string;
  stashed: string;
};

export const getTaskPillSummary = (tasks: FocusTaskLike[]) => {
  const visibleTasks = tasks.filter((task) => !task.deletedAt);

  return {
    queuedCount: visibleTasks.filter((task) => !task.completed).length,
    completedCount: visibleTasks.filter((task) => Boolean(task.completed)).length,
  };
};

export const getAgendaPillValue = (
  event: CalendarEvent | null,
  labels: AgendaPillLabels = {
    noUpcomingEvent: "No upcoming event",
    allDayEvent: "All-day event",
    upcomingEvent: "Upcoming event",
  },
): string => {
  if (!event) {
    return labels.noUpcomingEvent;
  }

  const summary = event.summary?.trim();
  if (summary) {
    return summary;
  }

  return isAllDayEvent(event) ? labels.allDayEvent : labels.upcomingEvent;
};

export const getZenModeStatus = ({
  enabled,
  availability = "ready",
  isActive = false,
  isStashed = false,
  readyValue,
  activeValue,
  labels,
}: {
  enabled: boolean;
  availability?: "ready" | "permission-needed" | "unavailable" | "error";
  isActive?: boolean;
  isStashed?: boolean;
  readyValue: string;
  activeValue: string;
  labels: ZenModeStatusLabels;
}): {
  tone: ZenModeStatusTone;
  value: string;
} => {
  if (!enabled) {
    return {
      tone: "off",
      value: labels.off,
    };
  }

  if (availability === "unavailable") {
    return {
      tone: "unavailable",
      value: labels.unavailable,
    };
  }

  if (availability === "permission-needed" || availability === "error") {
    return {
      tone: "warning",
      value: labels.permissionNeeded,
    };
  }

  if (isStashed) {
    return {
      tone: "active",
      value: labels.stashed,
    };
  }

  if (isActive) {
    return {
      tone: "active",
      value: activeValue,
    };
  }

  return {
    tone: "ready",
    value: readyValue,
  };
};
