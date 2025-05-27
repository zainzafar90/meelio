import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { taskApi } from "../api/task.api";
import { Task } from "../lib/db/models.dexie";
import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "./auth.store";
import { useSimpleSyncStore } from "./simple-sync.store";

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
  
  addList: (list: Omit<TodoList, "id"> & { id?: string }) => void;
  deleteList: (listId: string) => void;
  setActiveList: (listId: string | null) => void;
  
  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const generateId = () => crypto.randomUUID();

// Local storage key for custom lists
const CUSTOM_LISTS_KEY = "meelio_custom_lists";

// Load custom lists from localStorage
function loadCustomLists(): TodoList[] {
  try {
    const stored = localStorage.getItem(CUSTOM_LISTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save custom lists to localStorage
function saveCustomLists(lists: TodoList[]) {
  try {
    const customLists = lists.filter(l => l.type === "custom" && !DEFAULT_LISTS.some(d => d.id === l.id));
    localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(customLists));
  } catch (error) {
    console.error("Failed to save custom lists:", error);
  }
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
    lists: [...SYSTEM_LISTS, ...DEFAULT_LISTS, ...loadCustomLists()],
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

    addList: (list) => {
      const newList: TodoList = {
        ...list,
        id: list.id || generateId(),
      };
      
      set((state) => {
        const updatedLists = [...state.lists, newList];
        // Save custom lists to localStorage
        saveCustomLists(updatedLists);
        return { lists: updatedLists };
      });
    },

    deleteList: (listId) => {
      set((state) => {
        const updatedLists = state.lists.filter((l) => l.id !== listId && l.type !== "system");
        // Save custom lists to localStorage
        saveCustomLists(updatedLists);
        return {
          lists: updatedLists,
          activeListId: state.activeListId === listId ? "all" : state.activeListId,
        };
      });
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
        if (task.category && 
            !SYSTEM_LISTS.some(l => l.id === task.category) &&
            !DEFAULT_LISTS.some(l => l.id === task.category)) {
          taskCategories.add(task.category);
        }
      });

      // Load custom lists from localStorage
      const storedCustomLists = loadCustomLists();
      
      // Create lists for categories that exist in tasks but not in stored lists
      const newCategoryLists: TodoList[] = Array.from(taskCategories)
        .filter(cat => !storedCustomLists.some(l => l.id === cat.toLowerCase()))
        .map(cat => ({
          id: cat.toLowerCase(),
          name: cat,
          type: "custom" as const,
          emoji: "📝",
        }));

      // Merge all lists
      const allCustomLists = [...storedCustomLists, ...newCategoryLists];
      
      set({
        tasks: localTasks,
        lists: [...SYSTEM_LISTS, ...DEFAULT_LISTS, ...allCustomLists],
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

        // Load custom lists from localStorage
        const storedCustomLists = loadCustomLists();
        
        // Convert API categories to lists
        const serverCategoryLists: TodoList[] = apiCategories
          .filter(cat => !SYSTEM_LISTS.some(l => l.id === cat.toLowerCase()) &&
                         !DEFAULT_LISTS.some(l => l.id === cat.toLowerCase()) &&
                         !storedCustomLists.some(l => l.id === cat.toLowerCase()))
          .map(cat => ({
            id: cat.toLowerCase(),
            name: cat,
            type: "custom" as const,
            emoji: "📝",
          }));

        // Merge stored custom lists with server categories
        const allCustomLists = [...storedCustomLists, ...serverCategoryLists];

        set({
          tasks: serverTasks,
          lists: [...SYSTEM_LISTS, ...DEFAULT_LISTS, ...allCustomLists],
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
