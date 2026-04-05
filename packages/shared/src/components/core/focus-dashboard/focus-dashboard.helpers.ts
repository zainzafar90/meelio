import type { CalendarEvent } from "../../../types/calendar.types";
import { isAllDayEvent } from "../../../utils/calendar-date.utils";

type FocusTaskLike = {
  completed?: boolean;
  deletedAt?: number | null;
};

export const getTaskPillSummary = (tasks: FocusTaskLike[]) => {
  const visibleTasks = tasks.filter((task) => !task.deletedAt);

  return {
    queuedCount: visibleTasks.filter((task) => !task.completed).length,
    completedCount: visibleTasks.filter((task) => Boolean(task.completed)).length,
  };
};

export const getAgendaPillValue = (event: CalendarEvent | null): string | null => {
  if (!event) {
    return null;
  }

  const summary = event.summary?.trim();
  if (summary) {
    return summary;
  }

  return isAllDayEvent(event) ? "All-day event" : "Upcoming event";
};
