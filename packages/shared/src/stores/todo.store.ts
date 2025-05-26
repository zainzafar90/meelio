import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { taskApi } from "../api/task.api";
import { Task } from "../lib/db/models.dexie";
import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "./auth.store";
import { useSimpleSyncStore } from "./simple-sync.store";

const DEFAULT_CATEGORIES = [
  "Personal",
  "Work",
  "Shopping",
  "Health",
  "Learning",
  "Projects",
  "Ideas",
  "Urgent",
];

interface TodoState {
  categories: string[];
  tasks: Task[];
  activeCategory: string | null;
  isLoading: boolean;
  error: string | null;

  addTask: (task: {
    title: string;
    category?: string;
    dueDate?: string;
  }) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteTasksByCategory: (category: string) => Promise<void>;
  setActiveCategory: (category: string | null) => void;
  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const generateId = () => crypto.randomUUID();

async function processSyncQueue() {
  const syncStore = useSimpleSyncStore.getState();
  const queue = syncStore.getQueue("task");

  if (queue.length === 0 || !syncStore.isOnline) return;

  syncStore.setSyncing("task", true);

  for (const operation of queue) {
    try {
      switch (operation.type) {
        case "create":
          const created = await taskApi.createTask({
            title: operation.data.title,
            category: operation.data.category,
            completed: operation.data.completed || false,
          });
          await db.tasks.update(operation.entityId, { id: created.id });
          break;

        case "update":
          await taskApi.updateTask(operation.entityId, operation.data);
          break;

        case "delete":
          await taskApi.deleteTask(operation.entityId);
          break;
      }

      syncStore.removeFromQueue("task", operation.id);
    } catch (error) {
      console.error("Sync operation failed:", error);
      
      if (operation.retries >= 3) {
        syncStore.removeFromQueue("task", operation.id);
      } else {
        syncStore.incrementRetry("task", operation.id);
      }
    }
  }

  syncStore.setSyncing("task", false);
  syncStore.setLastSyncTime("task", Date.now());
}

let autoSyncInterval: NodeJS.Timeout | null = null;
function startAutoSync() {
  if (autoSyncInterval) clearInterval(autoSyncInterval);
  autoSyncInterval = setInterval(() => processSyncQueue(), 5 * 60 * 1000);
}

export const useTodoStore = create<TodoState>()(
  subscribeWithSelector((set, get) => ({
    categories: DEFAULT_CATEGORIES,
    tasks: [],
    activeCategory: null,
    isLoading: false,
    error: null,

    addTask: async (task) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ error: "User not authenticated" });
        return;
      }

      const syncStore = useSimpleSyncStore.getState();
      const newTask: Task = {
        id: generateId(),
        userId: user.id,
        title: task.title,
        completed: false,
        category: task.category,
        dueDate: task.dueDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      try {
        await db.tasks.add(newTask);
        
        set((state) => ({
          tasks: [...state.tasks, newTask],
          error: null,
        }));

        syncStore.addToQueue("task", {
          type: "create",
          entityId: newTask.id,
          data: newTask,
        });

        if (syncStore.isOnline) {
          processSyncQueue().then(() => get().loadFromLocal());
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to add task" });
      }
    },

    toggleTask: async (taskId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;

      const syncStore = useSimpleSyncStore.getState();
      const updatedData = {
        completed: !task.completed,
        updatedAt: Date.now(),
      };

      try {
        await db.tasks.update(taskId, updatedData);
        
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updatedData } : t
          ),
        }));

        syncStore.addToQueue("task", {
          type: "update",
          entityId: taskId,
          data: updatedData,
        });

        if (syncStore.isOnline) processSyncQueue();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to toggle task" });
      }
    },

    deleteTask: async (taskId) => {
      const syncStore = useSimpleSyncStore.getState();

      try {
        await db.tasks.delete(taskId);
        
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));

        syncStore.addToQueue("task", {
          type: "delete",
          entityId: taskId,
        });

        if (syncStore.isOnline) processSyncQueue();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to delete task" });
      }
    },

    deleteTasksByCategory: async (category) => {
      const syncStore = useSimpleSyncStore.getState();
      const tasksToDelete = get().tasks.filter((t) => t.category === category);

      try {
        await Promise.all(tasksToDelete.map((task) => db.tasks.delete(task.id)));
        
        set((state) => ({
          tasks: state.tasks.filter((t) => t.category !== category),
        }));

        tasksToDelete.forEach((task) => {
          syncStore.addToQueue("task", {
            type: "delete",
            entityId: task.id,
          });
        });

        if (syncStore.isOnline) processSyncQueue();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to delete tasks" });
      }
    },

    setActiveCategory: (category) => {
      set({ activeCategory: category });
    },

    initializeStore: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        set({ isLoading: true, error: null });
        startAutoSync();
        await get().loadFromLocal();

        const syncStore = useSimpleSyncStore.getState();
        if (syncStore.isOnline) {
          await get().syncWithServer();
        }
      } catch (error: any) {
        console.error("Failed to initialize todo store:", error);
        set({ error: error?.message || "Failed to initialize store" });
      } finally {
        set({ isLoading: false });
      }
    },

    loadFromLocal: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const localTasks = await db.tasks
        .where("userId")
        .equals(user.id)
        .toArray();

      const localCategories = new Set<string>();
      localTasks.forEach((task) => {
        if (task.category) localCategories.add(task.category);
      });

      set({
        tasks: localTasks,
        categories: [
          ...new Set([...DEFAULT_CATEGORIES, ...Array.from(localCategories)]),
        ],
      });
    },

    syncWithServer: async () => {
      const syncStore = useSimpleSyncStore.getState();

      try {
        await processSyncQueue();

        const [serverTasks, apiCategories] = await Promise.all([
          taskApi.getTasks(),
          taskApi.getCategories(),
        ]);

        await db.transaction("rw", db.tasks, async () => {
          const user = useAuthStore.getState().user;
          if (!user) return;

          await db.tasks.where("userId").equals(user.id).delete();

          await db.tasks.bulkAdd(serverTasks);
        });

        set({
          tasks: serverTasks,
          categories: [...new Set([...DEFAULT_CATEGORIES, ...apiCategories])],
        });

        syncStore.setSyncing("task", false);
        syncStore.setLastSyncTime("task", Date.now());
      } catch (error) {
        console.error("Sync failed:", error);
        syncStore.setSyncing("task", false);
      }
    },
  }))
);
