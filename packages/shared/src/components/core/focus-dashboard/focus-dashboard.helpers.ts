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
