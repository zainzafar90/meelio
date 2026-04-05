import { Task } from "../../../../lib/db/models.dexie";

export const getTaskFocusActionCopy = (task: Task) => {
  if (task.completed) {
    return null;
  }

  if (task.pinned) {
    return {
      label: "Focused",
      title: "This task is set as your current focus task.",
    };
  }

  return {
    label: "Focus",
    title: "Set this as your current focus task.",
  };
};
