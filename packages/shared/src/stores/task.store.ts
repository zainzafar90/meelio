import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Task } from "../lib/db/models.dexie";
import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "./auth.store";
import { useAppStore } from "./app.store";
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
  loadCategoriesAsLists: () => Promise<void>;

  getNextPinnedTask: () => Task | undefined;
}

let isInitializing = false;

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

      const activeListId = get().activeListId;

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
        providerId: task.providerId,
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
          const confettiEnabled = useAppStore.getState().confettiOnComplete;
          if (confettiEnabled) {
            launchConfetti();
          }
        }
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to toggle task",
        });
      }
    },

    deleteTask: async (taskId) => {
      try {
        const deletedAt = Date.now();
        await db.tasks.update(taskId, { deletedAt, updatedAt: deletedAt });

        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
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

        await get().loadFromLocal();
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

      set({
        tasks: localTasks.filter(t => !t.deletedAt),
        lists: SYSTEM_LISTS,
      });
    },

    togglePinTask: async (taskId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (task.completed && !task.pinned) {
        toast.warning("You can't pin a completed task");
        return;
      }

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
          set(() => ({
            lists: SYSTEM_LISTS
          }));
        }
      } catch (error) {
        console.error("Failed to load categories as lists:", error);
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
