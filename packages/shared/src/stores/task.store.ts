import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { taskApi } from "../api/task.api";
import { Task } from "../lib/db/models.dexie";
import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "./auth.store";
import { useSyncStore } from "./sync.store";
import { generateUUID } from "../utils/common.utils";
import { launchConfetti } from "../utils/confetti.utils";

export interface TaskListMeta {
  id: string;
  name: string;
  type: "system" | "custom";
  emoji?: string;
}

const DEFAULT_LISTS: TaskListMeta[] = [
  { id: "today", name: "Today", type: "system", emoji: "📅" },
  { id: "all", name: "All Tasks", type: "system", emoji: "📋" },
  { id: "completed", name: "Completed", type: "system", emoji: "✅" },
  { id: "personal", name: "Personal", type: "custom", emoji: "👤" },
  { id: "work", name: "Work", type: "custom", emoji: "💼" },
];

interface TaskState {
  lists: TaskListMeta[];
  tasks: Task[];
  activeListId: string | null;
  isLoading: boolean;
  error: string | null;

  addTask: (task: {
    title: string;
    category?: string;
    dueDate?: string;
    pinned?: boolean;
  }) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  togglePinTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteTasksByCategory: (category: string) => Promise<void>;

  addList: (list: Omit<TaskListMeta, "id"> & { id?: string }) => Promise<void>;
  deleteList: (listId: string) => void;
  setActiveList: (listId: string | null) => void;

  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncWithServer: () => Promise<void>;

  getNextPinnedTask: () => Task | undefined;
}

async function processSyncQueue() {
  const syncStore = useSyncStore.getState();
  const queue = syncStore.getQueue("task");

  if (queue.length === 0 || !syncStore.isOnline) return;

  syncStore.setSyncing("task", true);

  for (const operation of queue) {
    try {
      switch (operation.type) {
        case "create":
          {
            const created = await taskApi.createTask({
              title: operation.data.title,
              category: operation.data.category,
              completed: operation.data.completed || false,
            });
            await db.tasks.update(operation.entityId, { id: created.id });
          }
          break;

        case "update":
          {
            const updated = await taskApi.updateTask(
              operation.entityId,
              operation.data
            );
            await db.tasks.update(operation.entityId, { id: updated.id });
          }
          break;

        case "delete":
          {
            await taskApi.deleteTask(operation.entityId);
            await db.tasks.delete(operation.entityId);
          }
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

export const useTaskStore = create<TaskState>()(
  subscribeWithSelector((set, get) => ({
    lists: DEFAULT_LISTS,
    tasks: [],
    activeListId: "today",
    isLoading: false,
    error: null,

    addTask: async (task) => {
      const authState = useAuthStore.getState();
      const user = authState.user;
      const guestUser = authState.guestUser;

      const userId = user?.id || guestUser?.id;
      if (!userId) {
        set({ error: "No user session found" });
        return;
      }

      const syncStore = useSyncStore.getState();
      const newTask: Task = {
        id: generateUUID(),
        userId: userId,
        title: task.title,
        completed: false,
        pinned: task.pinned ?? false,
        category: task.category,
        dueDate: task.dueDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (newTask.pinned) {
        const pinnedTasks = get().tasks.filter((t) => t.pinned);
        await Promise.all(
          pinnedTasks.map(async (t) => {
            await db.tasks.update(t.id, {
              pinned: false,
              updatedAt: Date.now(),
            });
            if (user) {
              syncStore.addToQueue("task", {
                type: "update",
                entityId: t.id,
                data: { pinned: false, updatedAt: Date.now() },
              });
            }
          })
        );

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.pinned ? { ...t, pinned: false, updatedAt: Date.now() } : t
          ),
        }));
      }

      try {
        await db.tasks.add(newTask);

        set((state) => ({
          tasks: [...state.tasks, newTask],
          error: null,
        }));

        // Only sync for authenticated users, not guest users
        if (user && syncStore.isOnline) {
          syncStore.addToQueue("task", {
            type: "create",
            entityId: newTask.id,
            data: newTask,
          });

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

      const authState = useAuthStore.getState();
      const user = authState.user;
      const syncStore = useSyncStore.getState();
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

        if (updatedData.completed) {
          const confettiEnabled =
            authState.user?.settings?.task?.confettiOnComplete ?? false;
          if (confettiEnabled) {
            launchConfetti();
          }
        }

        // Only sync for authenticated users
        if (user) {
          syncStore.addToQueue("task", {
            type: "update",
            entityId: taskId,
            data: updatedData,
          });

          if (syncStore.isOnline) processSyncQueue();
        }
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to toggle task",
        });
      }
    },

    deleteTask: async (taskId) => {
      const authState = useAuthStore.getState();
      const user = authState.user;
      const syncStore = useSyncStore.getState();

      try {
        await db.tasks.delete(taskId);

        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));

        // Only sync for authenticated users
        if (user) {
          syncStore.addToQueue("task", {
            type: "delete",
            entityId: taskId,
          });

          if (syncStore.isOnline) processSyncQueue();
        }
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to delete task",
        });
      }
    },

    deleteTasksByCategory: async (category) => {
      const authState = useAuthStore.getState();
      const user = authState.user;
      const syncStore = useSyncStore.getState();
      const tasksToDelete = get().tasks.filter((t) => t.category === category);

      try {
        await Promise.all(
          tasksToDelete.map((task) => db.tasks.delete(task.id))
        );

        set((state) => ({
          tasks: state.tasks.filter((t) => t.category !== category),
        }));

        // Only sync for authenticated users
        if (user) {
          tasksToDelete.forEach((task) => {
            syncStore.addToQueue("task", {
              type: "delete",
              entityId: task.id,
            });
          });

          if (syncStore.isOnline) processSyncQueue();
        }
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to delete tasks",
        });
      }
    },

    addList: async (list) => {
      const authState = useAuthStore.getState();
      const user = authState.user;
      const guestUser = authState.guestUser;
      const userId = user?.id || guestUser?.id;

      if (!userId) return;

      const newList: TaskListMeta = {
        ...list,
        id: list.id || generateUUID(),
      };

      set((state) => ({
        lists: [...state.lists, newList],
      }));

      if (list.type === "custom") {
        const welcomeTask: Task = {
          id: generateUUID(),
          userId: userId,
          title: `Welcome to ${newList.name}!`,
          completed: false,
          pinned: false,
          category: newList.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        try {
          await db.tasks.add(welcomeTask);

          set((state) => ({
            tasks: [...state.tasks, welcomeTask],
          }));

          // Only sync for authenticated users
          if (user) {
            const syncStore = useSyncStore.getState();
            syncStore.addToQueue("task", {
              type: "create",
              entityId: welcomeTask.id,
              data: welcomeTask,
            });

            if (syncStore.isOnline) {
              processSyncQueue();
            }
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
          state.activeListId === listId ? "today" : state.activeListId,
      }));
    },

    setActiveList: (listId) => {
      set({ activeListId: listId });
    },

    initializeStore: async () => {
      const authState = useAuthStore.getState();
      const user = authState.user;
      const guestUser = authState.guestUser;
      const userId = user?.id || guestUser?.id;

      if (!userId) return;

      try {
        set({ isLoading: true, error: null });

        // Only start auto-sync for authenticated users
        if (user) {
          startAutoSync();
        }

        await get().loadFromLocal();

        // Only sync with server for authenticated users
        if (user) {
          const syncStore = useSyncStore.getState();
          if (syncStore.isOnline) {
            await get().syncWithServer();
          }
        }
      } catch (error: any) {
        console.error("Failed to initialize task store:", error);
        set({ error: error?.message || "Failed to initialize store" });
      } finally {
        set({ isLoading: false });
      }
    },

    loadFromLocal: async () => {
      const authState = useAuthStore.getState();
      const user = authState.user;
      const guestUser = authState.guestUser;
      const userId = user?.id || guestUser?.id;

      if (!userId) return;

      const localTasks = await db.tasks
        .where("userId")
        .equals(userId)
        .toArray();

      await Promise.all(
        localTasks.map(async (task) => {
          if (task.category === "today") {
            await db.tasks.update(task.id, {
              category: undefined,
              updatedAt: Date.now(),
            });
            task.category = undefined;
          }
        })
      );

      // Extract categories from tasks
      const taskCategories = new Set<string>();
      localTasks.forEach((task) => {
        if (
          task.category &&
          !DEFAULT_LISTS.some((l) => l.id === task.category)
        ) {
          taskCategories.add(task.category);
        }
      });

      const categoryListsMap = new Map<
        string,
        { list: TaskListMeta; latestTask: number }
      >();

      localTasks.forEach((task) => {
        if (
          task.category &&
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
        lists: [...DEFAULT_LISTS, ...sortedCategoryLists],
      });
    },

    syncWithServer: async () => {
      const authState = useAuthStore.getState();
      const user = authState.user;

      // Only authenticated users can sync with server
      if (!user) return;

      const syncStore = useSyncStore.getState();

      try {
        await processSyncQueue();

        const [serverTasks, apiCategories] = await Promise.all([
          taskApi.getTasks(),
          taskApi.getCategories(),
        ]);

        await db.transaction("rw", db.tasks, async () => {
          await db.tasks.where("userId").equals(user.id).delete();
          await db.tasks.bulkAdd(serverTasks);
        });

        // Convert API categories to lists
        const categoryLists: TaskListMeta[] = apiCategories
          .filter(
            (cat) => !DEFAULT_LISTS.some((l) => l.id === cat.toLowerCase())
          )
          .map((cat) => ({
            id: cat.toLowerCase(),
            name: cat,
            type: "custom" as const,
            emoji: "📝",
          }));

        set({
          tasks: serverTasks,
          lists: [...DEFAULT_LISTS, ...categoryLists],
        });

        syncStore.setSyncing("task", false);
        syncStore.setLastSyncTime("task", Date.now());
      } catch (error) {
        console.error("Sync failed:", error);
        syncStore.setSyncing("task", false);
      }
    },

    togglePinTask: async (taskId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;

      const authState = useAuthStore.getState();
      const user = authState.user;
      const syncStore = useSyncStore.getState();
      const updatedData = { pinned: !task.pinned, updatedAt: Date.now() };

      const unpinOthers = async () => {
        const pinnedTasks = get().tasks.filter(
          (t) => t.pinned && t.id !== taskId
        );
        await Promise.all(
          pinnedTasks.map(async (t) => {
            await db.tasks.update(t.id, {
              pinned: false,
              updatedAt: Date.now(),
            });
            if (user) {
              syncStore.addToQueue("task", {
                type: "update",
                entityId: t.id,
                data: { pinned: false, updatedAt: Date.now() },
              });
            }
          })
        );

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.pinned && t.id !== taskId
              ? { ...t, pinned: false, updatedAt: Date.now() }
              : t
          ),
        }));
      };

      try {
        if (updatedData.pinned) {
          await unpinOthers();
        }

        await db.tasks.update(taskId, updatedData);

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updatedData } : t
          ),
        }));

        if (user) {
          syncStore.addToQueue("task", {
            type: "update",
            entityId: taskId,
            data: updatedData,
          });

          if (syncStore.isOnline) processSyncQueue();
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Failed to pin task",
        });
      }
    },

    getNextPinnedTask: () => {
      const state = get();
      return state.tasks.find((t) => t.pinned && !t.completed);
    },
  }))
);
