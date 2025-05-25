import { create } from "zustand";

import {
  addTask,
  deleteTask,
  deleteTasksByCategory,
  getAllTasks,
  getCategories,
  getTasksByCategory,
  Task,
  updateTask,
} from "../lib/db";

interface TodoState {
  categories: string[];
  tasks: Task[];
  activeCategory: string | null;
  addTask: (task: Omit<Task, "createdAt" | "updatedAt">) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteTasksByCategory: (category: string) => Promise<void>;
  setActiveCategory: (category: string | null) => void;
  loadTasksByCategory: (category: string) => Promise<void>;
  loadAllTasks: () => Promise<void>;
  initializeStore: () => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  categories: [],
  tasks: [],
  activeCategory: null,

  addTask: async (task) => {
    await addTask(task);
    // Reload tasks based on current view
    const activeCategory = get().activeCategory;
    if (activeCategory) {
      await get().loadTasksByCategory(activeCategory);
    } else {
      await get().loadAllTasks();
    }
    // Update categories list
    const categories = await getCategories();
    set({ categories });
  },

  toggleTask: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) {
      await updateTask(taskId, { completed: !task.completed });
      // Reload tasks based on current view
      const activeCategory = get().activeCategory;
      if (activeCategory) {
        await get().loadTasksByCategory(activeCategory);
      } else {
        await get().loadAllTasks();
      }
    }
  },

  deleteTask: async (taskId) => {
    await deleteTask(taskId);
    // Reload tasks based on current view
    const activeCategory = get().activeCategory;
    if (activeCategory) {
      await get().loadTasksByCategory(activeCategory);
    } else {
      await get().loadAllTasks();
    }
    // Update categories list
    const categories = await getCategories();
    set({ categories });
  },

  deleteTasksByCategory: async (category) => {
    await deleteTasksByCategory(category);
    const [tasks, categories] = await Promise.all([
      getAllTasks(),
      getCategories(),
    ]);
    set({ tasks, categories });
  },

  setActiveCategory: (category) => set({ activeCategory: category }),

  loadTasksByCategory: async (category) => {
    const tasks = await getTasksByCategory(category);
    set({ tasks });
  },

  loadAllTasks: async () => {
    const tasks = await getAllTasks();
    set({ tasks });
  },

  initializeStore: async () => {
    const [tasks, categories] = await Promise.all([
      getAllTasks(),
      getCategories(),
    ]);
    set({ tasks, categories });
  },
}));

// Initialize the store when the app starts
useTodoStore.getState().initializeStore();
