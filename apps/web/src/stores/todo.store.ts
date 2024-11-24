import { create } from "zustand";

import {
  addList,
  addTask,
  deleteList,
  deleteTask,
  ensureSystemLists,
  getAllLists,
  getAllTasks,
  Task,
  TodoList,
  updateList,
  updateTask,
} from "@/lib/db/todo-db";

interface TodoState {
  isVisible: boolean;
  lists: TodoList[];
  tasks: Task[];
  activeListId: string;
  setIsVisible: (isVisible: boolean) => void;
  addTask: (task: Omit<Task, "createdAt" | "updatedAt">) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addList: (list: Omit<TodoList, "createdAt" | "updatedAt">) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  setActiveList: (listId: string) => void;
  updateListEmoji: (listId: string, emoji: string) => Promise<void>;
  initializeStore: () => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  isVisible: false,
  lists: [],
  tasks: [],
  activeListId: "today",

  setIsVisible: (isVisible) => set({ isVisible }),

  addTask: async (task) => {
    await addTask(task);
    const tasks = await getAllTasks();
    set({ tasks });
  },

  toggleTask: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) {
      await updateTask(taskId, { completed: !task.completed });
      const tasks = await getAllTasks();
      set({ tasks });
    }
  },

  deleteTask: async (taskId) => {
    await deleteTask(taskId);
    const tasks = await getAllTasks();
    set({ tasks });
  },

  addList: async (list) => {
    await addList(list);
    const lists = await getAllLists();
    set({ lists });
  },

  deleteList: async (listId) => {
    await deleteList(listId);
    const [lists, tasks] = await Promise.all([getAllLists(), getAllTasks()]);
    set({ lists, tasks });
  },

  setActiveList: (listId) => set({ activeListId: listId }),

  updateListEmoji: async (listId, emoji) => {
    await updateList(listId, { emoji });
    const lists = await getAllLists();
    set({ lists });
  },

  initializeStore: async () => {
    await ensureSystemLists();
    const [lists, tasks] = await Promise.all([getAllLists(), getAllTasks()]);
    set({ lists, tasks });
  },
}));

// Initialize the store when the app starts
useTodoStore.getState().initializeStore();
