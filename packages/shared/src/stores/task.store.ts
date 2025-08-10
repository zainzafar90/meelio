import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { taskApi } from "../api/task.api";
import { Task } from "../lib/db/models.dexie";
import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "./auth.store";
import { SyncState, useSyncStore } from "./sync.store";
import { lwwMergeById } from "../utils/sync.utils";
import { createEntitySync } from "../utils/sync-core";
import { useCategoryStore } from "./category.store";
import { generateUUID } from "../utils/common.utils";
import { launchConfetti } from "../utils/confetti.utils";
import { toast } from "sonner";

export interface TaskListMeta {
  id: string;
  name: string;
  type: "system" | "custom";
  emoji?: string;
}

const SYSTEM_LISTS: TaskListMeta[] = [
  { id: "all", name: "All Tasks", type: "system", emoji: "📋" },
  { id: "today", name: "Today", type: "system", emoji: "📅" },
  { id: "completed", name: "Completed", type: "system", emoji: "✅" },
];

interface TaskState {
  lists: TaskListMeta[];
  tasks: Task[];
  activeListId: string | null;
  isLoading: boolean;
  error: string | null;

  addTask: (task: {
    title: string;
    dueDate?: string;
    pinned?: boolean;
    categoryId?: string;
    providerId?: string;
  }) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  togglePinTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  addList: (list: Omit<TaskListMeta, "id"> & { id?: string }) => Promise<void>;
  deleteList: (listId: string) => void;
  setActiveList: (listId: string | null) => void;

  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  loadCategoriesAsLists: () => Promise<void>;

  getNextPinnedTask: () => Task | undefined;
}

let taskEntitySync: ReturnType<typeof createEntitySync<any, any, any, any, any>> | null = null;

async function processSyncQueue() {
  if (!taskEntitySync) return;
  return taskEntitySync.processQueue();
}

let autoSyncInterval: NodeJS.Timeout | null = null;
let isInitializing = false;

function startAutoSync() {
  if (autoSyncInterval) clearInterval(autoSyncInterval);
  // Hourly sync to keep server load light (eventual consistency)
  autoSyncInterval = setInterval(() => processSyncQueue(), 60 * 60 * 1000);
}

export const useTaskStore = create<TaskState>()(
  subscribeWithSelector((set, get) => ({
    lists: SYSTEM_LISTS,
    tasks: [],
    activeListId: "all",
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
      const activeListId = get().activeListId;

      // If the active list is a category (not a system list), assign it to the task
      let categoryId = task.categoryId;
      if (activeListId && !["all", "today", "completed"].includes(activeListId)) {
        categoryId = activeListId;
      }

      let normalizedDueDate = task.dueDate;
      if (task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        normalizedDueDate = today.toISOString();
      }

      const newTask: Task = {
        id: generateUUID(),
        userId: userId,
        title: task.title,
        completed: false,
        pinned: task.pinned ?? false,
        dueDate: normalizedDueDate,
        categoryId,
        providerId: task.providerId, // For now, we'll need to pass this from the backend
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
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

        if (user) {
          syncStore.addToQueue("task", {
            type: "create",
            entityId: newTask.id,
            data: newTask,
          });

          if (syncStore.isOnline) {
            processSyncQueue();
          }
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
        ...(task.pinned && !task.completed ? { pinned: false } : {}),
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
        const deletedAt = Date.now();
        // Soft delete locally (tombstone)
        await db.tasks.update(taskId, { deletedAt, updatedAt: deletedAt });

        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));

        // Only sync for authenticated users
        if (user) {
          syncStore.addToQueue("task", {
            type: "delete",
            entityId: taskId,
            data: { deletedAt },
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

      if (isInitializing) {
        return;
      }

      isInitializing = true;

      try {
        set({ isLoading: true, error: null });

        if (user) {
          startAutoSync();
        }

        await get().loadFromLocal();

        if (user) {
          const syncStore = useSyncStore.getState();
          if (syncStore.isOnline) {
            await get().syncWithServer();
          }
        }

        // Load categories as lists after potential sync
        await get().loadCategoriesAsLists();
      } catch (error: any) {
        console.error("Failed to initialize task store:", error);
        set({ error: error?.message || "Failed to initialize store" });
      } finally {
        set({ isLoading: false });
        isInitializing = false;
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
        })
      );


        set({
          tasks: localTasks.filter(t => !t.deletedAt),
          lists: SYSTEM_LISTS,
        });
    },

    syncWithServer: async () => {
      if (!taskEntitySync) return;
      await taskEntitySync.syncWithServer();
    },

    togglePinTask: async (taskId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Don't allow pinning completed tasks
      if (task.completed && !task.pinned) {
        toast.warning("You can't pin a completed task");
        return;
      }

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

    loadCategoriesAsLists: async () => {
      try {
        const authState = useAuthStore.getState();
        const user = authState.user;
        const guestUser = authState.guestUser;

        // Only load categories if we have a user (guest or authenticated)
        if (user || guestUser) {
          await useCategoryStore.getState().loadCategories();
          const categories = useCategoryStore.getState().categories;

          const categoryLists: TaskListMeta[] = categories.map(category => ({
            id: category.id,
            name: category.name,
            type: "custom" as const,
            emoji: category.icon || "🏷️",
          }));

          set(() => ({
            lists: [...SYSTEM_LISTS, ...categoryLists]
          }));
        } else {
          // No user, just show system lists
          set(() => ({
            lists: SYSTEM_LISTS
          }));
        }
      } catch (error) {
        console.error("Failed to load categories as lists:", error);
        // Fallback to system lists only
        set(() => ({
          lists: SYSTEM_LISTS
        }));
      }
    },

    getNextPinnedTask: () => {
      const state = get();
      return state.tasks.find((t) => t.pinned && !t.completed);
    },
  }))
);

// Initialize taskEntitySync after store definition to avoid circular dependencies on useTaskStore
taskEntitySync = createEntitySync<Task, any,
  { clientId?: string; title: string; completed?: boolean; dueDate?: string; pinned?: boolean; categoryId?: string; providerId?: string; updatedAt?: number },
  { id?: string; clientId?: string; title?: string; completed?: boolean; dueDate?: string; pinned?: boolean; categoryId?: string; providerId?: string; updatedAt?: number; deletedAt?: number | null },
  { id?: string; clientId?: string; deletedAt?: number }
>({
  entityKey: "task",
  dbTable: db.tasks as any,
  bulkSync: taskApi.bulkSync,
  fetchAll: taskApi.getTasks as any,
  normalizeFromServer: (t: any): Task => ({
    ...t,
    createdAt: new Date(t.createdAt).getTime(),
    updatedAt: new Date(t.updatedAt).getTime(),
    deletedAt: t.deletedAt ? new Date(t.deletedAt).getTime() : null,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : undefined,
  }),
  toCreatePayload: (op) => {
    if (op.type !== "create") return null;
    const d = op.data || {};
    return {
      clientId: op.entityId,
      title: d.title,
      completed: !!d.completed,
      dueDate: d.dueDate,
      pinned: !!d.pinned,
      categoryId: d.categoryId,
      providerId: d.providerId,
      updatedAt: d.updatedAt,
    };
  },
  toUpdatePayload: (op) => {
    if (op.type !== "update") return null;
    return { id: op.entityId, ...(op.data || {}) };
  },
  toDeletePayload: (op) => {
    if (op.type !== "delete") return null;
    return { id: op.entityId, deletedAt: op.data?.deletedAt };
  },
  getUserId: () => useAuthStore.getState().user?.id,
  inMemorySelector: () => useTaskStore.getState().tasks,
  inMemorySetter: (list) => useTaskStore.setState({ tasks: list }),
});

/**
  * ╔═══════════════════════════════════════════════════════════════════════╗
  * ║                    Handle Online Status Changes                       ║
  * ╠═══════════════════════════════════════════════════════════════════════╣
  * ║  Triggers sync queue processing when transitioning from offline       ║
  * ║  to online. Ensures no concurrent syncs are running.                  ║
  * ╚═══════════════════════════════════════════════════════════════════════╝
***/
let isSyncingOnReconnect = false;

const handleOnlineStatusChange = (state: SyncState, prevState: SyncState) => {
  const justCameOnline = state.isOnline && !prevState.isOnline;
  const isAuthenticated = useAuthStore.getState().user;
  const canSync = justCameOnline && isAuthenticated && !isSyncingOnReconnect;

  if (canSync) {
    isSyncingOnReconnect = true;
    useTaskStore
      .getState()
      .syncWithServer()
      .finally(() => {
        isSyncingOnReconnect = false;
      });
  }
};

useSyncStore.subscribe(handleOnlineStatusChange);

