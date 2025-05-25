import { create } from "zustand";
import { taskApi } from "../api/task.api";
import { Task } from "../lib/db/models.dexie";

// Default categories to always show
const DEFAULT_CATEGORIES = [
  "Personal",
  "Work", 
  "Shopping",
  "Health",
  "Learning",
  "Projects",
  "Ideas",
  "Urgent"
];

interface TodoState {
  categories: string[];
  tasks: Task[];
  activeCategory: string | null;
  isLoading: boolean;
  error: string | null;
  addTask: (task: { title: string; category?: string }) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteTasksByCategory: (category: string) => Promise<void>;
  setActiveCategory: (category: string | null) => Promise<void>;
  loadTasksByCategory: (category: string) => Promise<void>;
  loadAllTasks: () => Promise<void>;
  loadCompletedTasks: () => Promise<void>;
  initializeStore: () => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  tasks: [],
  activeCategory: null,
  isLoading: false,
  error: null,

  addTask: async (task) => {
    try {
      set({ isLoading: true, error: null });
      await taskApi.createTask({
        title: task.title,
        category: task.category,
        completed: false,
      });
      
      // Reload tasks based on current view
      const activeCategory = get().activeCategory;
      if (activeCategory === "completed") {
        await get().loadCompletedTasks();
      } else if (activeCategory) {
        await get().loadTasksByCategory(activeCategory);
      } else {
        await get().loadAllTasks();
      }
      
      // Update categories list - merge with defaults
      const apiCategories = await taskApi.getCategories();
      const mergedCategories = [...new Set([...DEFAULT_CATEGORIES, ...apiCategories])];
      set({ categories: mergedCategories });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to add task" });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleTask: async (taskId) => {
    try {
      const task = get().tasks.find((t) => t.id === taskId);
      if (task) {
        await taskApi.updateTask(taskId, { completed: !task.completed });
        
        // Reload tasks based on current view
        const activeCategory = get().activeCategory;
        if (activeCategory === "completed") {
          await get().loadCompletedTasks();
        } else if (activeCategory) {
          await get().loadTasksByCategory(activeCategory);
        } else {
          await get().loadAllTasks();
        }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to toggle task" });
    }
  },

  deleteTask: async (taskId) => {
    try {
      await taskApi.deleteTask(taskId);
      
      // Reload tasks based on current view
      const activeCategory = get().activeCategory;
      if (activeCategory === "completed") {
        await get().loadCompletedTasks();
      } else if (activeCategory) {
        await get().loadTasksByCategory(activeCategory);
      } else {
        await get().loadAllTasks();
      }
      
      // Update categories list - merge with defaults
      const apiCategories = await taskApi.getCategories();
      const mergedCategories = [...new Set([...DEFAULT_CATEGORIES, ...apiCategories])];
      set({ categories: mergedCategories });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to delete task" });
    }
  },

  deleteTasksByCategory: async (category) => {
    try {
      await taskApi.deleteTasksByCategory(category);
      const [tasks, apiCategories] = await Promise.all([
        taskApi.getTasks(),
        taskApi.getCategories(),
      ]);
      const mergedCategories = [...new Set([...DEFAULT_CATEGORIES, ...apiCategories])];
      set({ tasks, categories: mergedCategories });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to delete tasks" });
    }
  },

  setActiveCategory: async (category) => {
    set({ activeCategory: category });
    // Load tasks based on the new category
    if (category === "completed") {
      await get().loadCompletedTasks();
    } else if (category) {
      await get().loadTasksByCategory(category);
    } else {
      await get().loadAllTasks();
    }
  },

  loadTasksByCategory: async (category) => {
    try {
      set({ isLoading: true, error: null });
      const tasks = await taskApi.getTasksByCategory(category);
      set({ tasks });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load tasks" });
    } finally {
      set({ isLoading: false });
    }
  },

  loadAllTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const tasks = await taskApi.getTasks();
      set({ tasks });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load tasks" });
    } finally {
      set({ isLoading: false });
    }
  },

  loadCompletedTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const allTasks = await taskApi.getTasks();
      const completedTasks = allTasks.filter(task => task.completed);
      set({ tasks: completedTasks });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load completed tasks" });
    } finally {
      set({ isLoading: false });
    }
  },

  initializeStore: async () => {
    try {
      set({ isLoading: true, error: null });
      const [tasks, apiCategories] = await Promise.all([
        taskApi.getTasks(),
        taskApi.getCategories(),
      ]);
      const mergedCategories = [...new Set([...DEFAULT_CATEGORIES, ...apiCategories])];
      set({ tasks, categories: mergedCategories });
    } catch (error: any) {
      console.error("Failed to initialize todo store:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to initialize store";
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Don't auto-initialize - let components handle it after auth