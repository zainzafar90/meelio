import type { CalendarEvent } from "../../../types/calendar.types";
import { isAllDayEvent } from "../../../utils/calendar-date.utils";

type FocusTaskLike = {
  id: string;
  title: string;
  completed?: boolean;
  pinned?: boolean;
  deletedAt?: number | null;
  updatedAt?: number;
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

export const selectFocusTasks = (tasks: FocusTaskLike[]) =>
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

export const getPinnedTask = (tasks: FocusTaskLike[]) =>
  tasks
    .filter((task) => !task.completed && !task.deletedAt && task.pinned)
    .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))[0] ??
  null;

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
