import { createQuickCaptureStore as createApplicationQuickCaptureStore } from "@repo/application/quick-capture";

import { useNoteStore } from "./note.store";
import { useTaskStore } from "./task.store";

export const useQuickCaptureStore = createApplicationQuickCaptureStore({
  submitTask: async ({ title }) => {
    const task = await useTaskStore.getState().addTask({
      title,
      pinned: true,
    });

    if (!task) {
      throw new Error("Failed to create task");
    }

    return {
      createdId: task.id,
      createdTitle: task.title,
    };
  },
  submitNote: async ({ title, content }) => {
    const note = await useNoteStore.getState().addNote({
      title,
      content,
      pinned: true,
    });

    if (!note) {
      throw new Error("Failed to create note");
    }

    return {
      createdId: note.id,
      createdTitle: note.title,
    };
  },
});
