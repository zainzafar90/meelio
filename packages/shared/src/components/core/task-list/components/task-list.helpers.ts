import { Task } from "../../../../lib/db/models.dexie";

export const getTaskFocusActionCopy = (task: Task) => {
  if (task.completed) {
    return null;
  }

  if (task.pinned) {
    return {
      labelKey: "tasks.item.focused",
      label: "Focused",
      titleKey: "tasks.item.focusedTitle",
      title: "This task is set as your current focus task.",
    };
  }

  return {
    labelKey: "tasks.item.focus",
    label: "Focus",
    titleKey: "tasks.item.focusTitle",
    title: "Set this as your current focus task.",
  };
};
