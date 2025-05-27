import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { taskApi } from "../api/task.api";
import { Task } from "../lib/db/models.dexie";
import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "./auth.store";
import { useSimpleSyncStore } from "./simple-sync.store";
import { generateUUID } from "../utils/common.utils";

export interface TodoList {
  id: string;
  name: string;
  type: "system" | "custom";
  emoji?: string;
}

const SYSTEM_LISTS: TodoList[] = [
  { id: "all", name: "All Tasks", type: "system", emoji: "📋" },
  { id: "completed", name: "Completed", type: "system", emoji: "✅" },
  { id: "today", name: "Today", type: "system", emoji: "📅" },
];

const DEFAULT_LISTS: TodoList[] = [
  { id: "personal", name: "Personal", type: "custom", emoji: "👤" },
  { id: "work", name: "Work", type: "custom", emoji: "💼" },
];

interface TodoState {
  lists: TodoList[];
  tasks: Task[];
  activeListId: string | null;
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

  addList: (list: Omit<TodoList, "id"> & { id?: string }) => Promise<void>;
  deleteList: (listId: string) => void;
  setActiveList: (listId: string | null) => void;

  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

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
    lists: [...SYSTEM_LISTS, ...DEFAULT_LISTS],
    tasks: [],
    activeListId: "all",
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
        id: generateUUID(),
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
        set({
          error: error instanceof Error ? error.message : "Failed to add task",
        });
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
        set({
          error:
            error instanceof Error ? error.message : "Failed to toggle task",
        });
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
        set({
          error:
            error instanceof Error ? error.message : "Failed to delete task",
        });
      }
    },

    deleteTasksByCategory: async (category) => {
      const syncStore = useSimpleSyncStore.getState();
      const tasksToDelete = get().tasks.filter((t) => t.category === category);

      try {
        await Promise.all(
          tasksToDelete.map((task) => db.tasks.delete(task.id))
        );

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
        set({
          error:
            error instanceof Error ? error.message : "Failed to delete tasks",
        });
      }
    },

    addList: async (list) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const newList: TodoList = {
        ...list,
        id: list.id || generateUUID(),
      };

      set((state) => ({
        lists: [...state.lists, newList],
      }));

      if (list.type === "custom") {
        const welcomeTask: Task = {
          id: generateUUID(),
          userId: user.id,
          title: `Welcome to ${newList.name}!`,
          completed: false,
          category: newList.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        try {
          await db.tasks.add(welcomeTask);

          set((state) => ({
            tasks: [...state.tasks, welcomeTask],
          }));

          const syncStore = useSimpleSyncStore.getState();
          syncStore.addToQueue("task", {
            type: "create",
            entityId: welcomeTask.id,
            data: welcomeTask,
          });

          if (syncStore.isOnline) {
            processSyncQueue();
          }
        } catch (error) {
          console.error("Failed to create welcome task:", error);
        }
      }
    },

    deleteList: (listId) => {
      set((state) => ({
        lists: state.lists.filter(
          (l) => l.id !== listId && l.type !== "system"
        ),
        activeListId:
          state.activeListId === listId ? "all" : state.activeListId,
      }));
    },

    setActiveList: (listId) => {
      set({ activeListId: listId });
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

      // Extract categories from tasks
      const taskCategories = new Set<string>();
      localTasks.forEach((task) => {
        if (
          task.category &&
          !SYSTEM_LISTS.some((l) => l.id === task.category) &&
          !DEFAULT_LISTS.some((l) => l.id === task.category)
        ) {
          taskCategories.add(task.category);
        }
      });

      const categoryListsMap = new Map<
        string,
        { list: TodoList; latestTask: number }
      >();

      localTasks.forEach((task) => {
        if (
          task.category &&
          !SYSTEM_LISTS.some((l) => l.id === task.category) &&
          !DEFAULT_LISTS.some((l) => l.id === task.category)
        ) {
          const existing = categoryListsMap.get(task.category.toLowerCase());
          const taskTime = task.createdAt || 0;

          if (!existing || taskTime > existing.latestTask) {
            categoryListsMap.set(task.category.toLowerCase(), {
              list: {
                id: task.category.toLowerCase(),
                name: task.category,
                type: "custom" as const,
                emoji: "📝",
              },
              latestTask: taskTime,
            });
          }
        }
      });

      const sortedCategoryLists = Array.from(categoryListsMap.values())
        .sort((a, b) => b.latestTask - a.latestTask)
        .map((item) => item.list);

      set({
        tasks: localTasks,
        lists: [...SYSTEM_LISTS, ...DEFAULT_LISTS, ...sortedCategoryLists],
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

        // Convert API categories to lists
        const categoryLists: TodoList[] = apiCategories
          .filter(
            (cat) =>
              !SYSTEM_LISTS.some((l) => l.id === cat.toLowerCase()) &&
              !DEFAULT_LISTS.some((l) => l.id === cat.toLowerCase())
          )
          .map((cat) => ({
            id: cat.toLowerCase(),
            name: cat,
            type: "custom" as const,
            emoji: "📝",
          }));

        set({
          tasks: serverTasks,
          lists: [...SYSTEM_LISTS, ...DEFAULT_LISTS, ...categoryLists],
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
