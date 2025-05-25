import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db } from "../db/meelio.dexie";
import { taskRepository, TaskFilters } from "../repositories/task.repository";
import type { Task } from "../db/models.dexie";

interface TaskStore {
  tasks: Task[];
  categories: string[];
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  setSelectedCategory: (category: string | null) => void;
  clearError: () => void;

  // Local-first operations
  getTasksFromLocal: () => Promise<Task[]>;
  syncWithServer: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: [],
      selectedCategory: null,
      isLoading: false,
      error: null,

      fetchTasks: async (filters?: TaskFilters) => {
        set({ isLoading: true, error: null });
        try {
          // Try to fetch from server
          const tasks = await taskRepository.getTasks(filters);
          set({ tasks, isLoading: false });
          
          // Update local DB
          await db.tasks.clear();
          await db.tasks.bulkAdd(tasks);
        } catch (error) {
          // Fallback to local data
          const localTasks = await get().getTasksFromLocal();
          set({ 
            tasks: localTasks, 
            isLoading: false,
            error: "Failed to fetch from server. Showing local data."
          });
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await taskRepository.getCategories();
          set({ categories });
        } catch (error) {
          // Get categories from local tasks
          const localTasks = await db.tasks.toArray();
          const uniqueCategories = [...new Set(localTasks
            .map(t => t.category)
            .filter((c): c is string => c !== null && c !== undefined)
          )];
          set({ categories: uniqueCategories });
        }
      },

      createTask: async (taskData) => {
        set({ isLoading: true, error: null });
        try {
          const newTask = await taskRepository.createTask(taskData);
          
          // Update local state and DB
          await db.tasks.add(newTask);
          set(state => ({ 
            tasks: [...state.tasks, newTask],
            isLoading: false 
          }));
        } catch (error) {
          set({ 
            isLoading: false, 
            error: "Failed to create task" 
          });
          throw error;
        }
      },

      updateTask: async (taskId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const updatedTask = await taskRepository.updateTask(taskId, updates);
          
          // Update local state and DB
          await db.tasks.update(taskId, updates);
          set(state => ({
            tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            isLoading: false, 
            error: "Failed to update task" 
          });
          throw error;
        }
      },

      deleteTask: async (taskId) => {
        set({ isLoading: true, error: null });
        try {
          await taskRepository.deleteTask(taskId);
          
          // Update local state and DB
          await db.tasks.delete(taskId);
          set(state => ({
            tasks: state.tasks.filter(t => t.id !== taskId),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            isLoading: false, 
            error: "Failed to delete task" 
          });
          throw error;
        }
      },

      toggleTaskComplete: async (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        await get().updateTask(taskId, { completed: !task.completed });
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      clearError: () => {
        set({ error: null });
      },

      getTasksFromLocal: async () => {
        try {
          return await db.tasks.toArray();
        } catch (error) {
          console.error("Failed to get tasks from local DB:", error);
          return [];
        }
      },

      syncWithServer: async () => {
        const state = get();
        if (state.isLoading) return;

        try {
          // Get latest from server
          const serverTasks = await taskRepository.getTasks();
          
          // Replace local data with server data
          await db.tasks.clear();
          await db.tasks.bulkAdd(serverTasks);
          
          set({ tasks: serverTasks });
        } catch (error) {
          console.error("Sync failed:", error);
        }
      },
    }),
    {
      name: "task-store",
      partialize: (state) => ({
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);