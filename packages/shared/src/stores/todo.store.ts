import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { taskApi } from "../api/task.api";
import { Task } from "../lib/db/models.dexie";
import { db, resetDatabase } from "../lib/db/meelio.dexie";
import { useAuthStore } from "./auth.store";
import { useSimpleSyncStore } from "./simple-sync.store";

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
  // Core state
  categories: string[];
  tasks: Task[];
  activeCategory: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addTask: (task: { title: string; category?: string; dueDate?: string }) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteTasksByCategory: (category: string) => Promise<void>;
  setActiveCategory: (category: string | null) => Promise<void>;
  loadTasksByCategory: (category: string) => Promise<void>;
  loadAllTasks: () => Promise<void>;
  loadCompletedTasks: () => Promise<void>;
  initializeStore: () => Promise<void>;
  
  // Internal helpers
  _loadFromLocal: () => Promise<void>;
  _syncWithServer: () => Promise<void>;
}

// Helper to generate UUIDs
const generateId = () => crypto.randomUUID();

// Process sync queue for tasks
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
          // Update local task with server ID if needed
          await db.tasks.update(operation.entityId, { id: created.id });
          break;
          
        case "update":
          await taskApi.updateTask(operation.entityId, operation.data);
          break;
          
        case "delete":
          await taskApi.deleteTask(operation.entityId);
          break;
      }
      
      // Remove from queue on success
      syncStore.removeFromQueue("task", operation.id);
    } catch (error) {
      console.error("Sync operation failed:", error);
      
      // Check current retry count
      if (operation.retries >= 3) {
        // Too many retries, remove from queue
        syncStore.removeFromQueue("task", operation.id);
      } else {
        // Increment retry count for next attempt
        syncStore.incrementRetry("task", operation.id);
      }
    }
  }
  
  syncStore.setSyncing("task", false);
  syncStore.setLastSyncTime("task", Date.now());
}

// Auto-sync interval
let autoSyncInterval: NodeJS.Timeout | null = null;
function startAutoSync() {
  if (autoSyncInterval) clearInterval(autoSyncInterval);
  autoSyncInterval = setInterval(() => {
    processSyncQueue();
  }, 5 * 60 * 1000); // 5 minutes
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
        // 1. Always save to IndexedDB first (offline-first)
        await db.tasks.add(newTask);
        
        // 2. Update UI immediately
        set((state) => ({
          tasks: [...state.tasks, newTask],
          error: null,
        }));

        // 3. Queue for sync
        syncStore.addToQueue("task", {
          type: "create",
          entityId: newTask.id,
          data: newTask,
        });

        // 4. Try to sync if online
        if (syncStore.isOnline) {
          processSyncQueue().then(async () => {
            // Reload to get server IDs
            await get()._loadFromLocal();
          });
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
        // 1. Update IndexedDB first
        await db.tasks.update(taskId, updatedData);
        
        // 2. Update UI immediately
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updatedData } : t
          ),
        }));

        // 3. Queue for sync
        syncStore.addToQueue("task", {
          type: "update",
          entityId: taskId,
          data: updatedData,
        });

        // 4. Try to sync if online
        if (syncStore.isOnline) {
          processSyncQueue();
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to toggle task" });
      }
    },

    deleteTask: async (taskId) => {
      const syncStore = useSimpleSyncStore.getState();

      try {
        // 1. Delete from IndexedDB first
        await db.tasks.delete(taskId);
        
        // 2. Update UI immediately
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));

        // 3. Queue for sync
        syncStore.addToQueue("task", {
          type: "delete",
          entityId: taskId,
        });

        // 4. Try to sync if online
        if (syncStore.isOnline) {
          processSyncQueue();
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to delete task" });
      }
    },

    deleteTasksByCategory: async (category) => {
      const syncStore = useSimpleSyncStore.getState();
      const tasksToDelete = get().tasks.filter(t => t.category === category);

      try {
        // 1. Delete from IndexedDB
        await Promise.all(tasksToDelete.map(task => db.tasks.delete(task.id)));
        
        // 2. Update UI immediately
        set((state) => ({
          tasks: state.tasks.filter(t => t.category !== category),
        }));

        // 3. Queue for sync
        tasksToDelete.forEach(task => {
          syncStore.addToQueue("task", {
            type: "delete",
            entityId: task.id,
          });
        });

        // 4. Try to sync if online
        if (syncStore.isOnline) {
          processSyncQueue();
        }
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

    loadTasksByCategory: async (_category) => {
      // The current implementation filters in the UI, not in the store
      // This maintains compatibility with existing behavior
      await get()._loadFromLocal();
    },

    loadAllTasks: async () => {
      await get()._loadFromLocal();
    },

    loadCompletedTasks: async () => {
      // The current implementation filters in the UI, not in the store
      // This maintains compatibility with existing behavior
      await get()._loadFromLocal();
    },

    initializeStore: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        set({ isLoading: true, error: null });
        
        // Start auto-sync
        startAutoSync();
        
        // Load from local first
        await get()._loadFromLocal();
        
        // Then sync with server if online
        const syncStore = useSimpleSyncStore.getState();
        if (syncStore.isOnline) {
          await get()._syncWithServer();
        }
      } catch (error: any) {
        console.error("Failed to initialize todo store:", error);
        set({ error: error?.message || "Failed to initialize store" });
      } finally {
        set({ isLoading: false });
      }
    },

    _loadFromLocal: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        const localTasks = await db.tasks
          .where("userId")
          .equals(user.id)
          .toArray();
        
        // Extract categories from local tasks
        const localCategories = new Set<string>();
        localTasks.forEach(task => {
          if (task.category) localCategories.add(task.category);
        });
        
        set({ 
          tasks: localTasks,
          categories: [...new Set([...DEFAULT_CATEGORIES, ...Array.from(localCategories)])]
        });
      } catch (error: any) {
        console.error("Failed to load from local database:", error);
        
        // Handle database upgrade errors
        if (error.name === "VersionError" || 
            (error.name === "DatabaseClosedError" && error.message?.includes("UpgradeError"))) {
          console.warn("Database version/upgrade error detected, attempting migration...");
          try {
            // Close and reopen the database to trigger migration
            db.close();
            await db.open();
            
            // Retry loading after migration
            const localTasks = await db.tasks
              .where("userId")
              .equals(user.id)
              .toArray();
            
            const localCategories = new Set<string>();
            localTasks.forEach(task => {
              if (task.category) localCategories.add(task.category);
            });
            
            set({ 
              tasks: localTasks,
              categories: [...new Set([...DEFAULT_CATEGORIES, ...Array.from(localCategories)])]
            });
            return;
          } catch (migrationError) {
            console.error("Migration failed, resetting database:", migrationError);
            try {
              await resetDatabase();
              set({ tasks: [], categories: DEFAULT_CATEGORIES });
            } catch (resetError) {
              console.error("Failed to reset database:", resetError);
            }
          }
        }
        
        // If there's a schema error, try to query without userId filter as fallback
        if (error.name === "SchemaError") {
          console.warn("Schema error detected, trying alternative query...");
          try {
            const allTasks = await db.tasks.toArray();
            const userTasks = allTasks.filter(task => task.userId === user.id);
            
            const localCategories = new Set<string>();
            userTasks.forEach(task => {
              if (task.category) localCategories.add(task.category);
            });
            
            set({ 
              tasks: userTasks,
              categories: [...new Set([...DEFAULT_CATEGORIES, ...Array.from(localCategories)])]
            });
          } catch (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
            // Set empty state on complete failure
            set({ tasks: [], categories: DEFAULT_CATEGORIES });
          }
        } else {
          // For other errors, set empty state
          set({ tasks: [], categories: DEFAULT_CATEGORIES });
        }
      }
    },

    _syncWithServer: async () => {
      const syncStore = useSimpleSyncStore.getState();
      
      try {
        // Process any pending sync operations
        await processSyncQueue();
        
        // Fetch latest from server
        const [serverTasks, apiCategories] = await Promise.all([
          taskApi.getTasks(),
          taskApi.getCategories(),
        ]);

        // Clear local and replace with server data (server is source of truth)
        await db.transaction("rw", db.tasks, async () => {
          const user = useAuthStore.getState().user;
          if (!user) return;
          
          // Delete only current user's tasks
          await db.tasks.where("userId").equals(user.id).delete();
          
          // Add server tasks
          await db.tasks.bulkAdd(serverTasks);
        });

        set({
          tasks: serverTasks,
          categories: [...new Set([...DEFAULT_CATEGORIES, ...apiCategories])],
        });
        
        // Mark sync as successful
        syncStore.setSyncing("task", false);
        syncStore.setLastSyncTime("task", Date.now());
      } catch (error: any) {
        console.error("Sync failed:", error);
        
        // Handle database upgrade errors
        if (error.name === "DatabaseClosedError" && error.message?.includes("UpgradeError")) {
          console.warn("Database upgrade error during sync, resetting database...");
          try {
            await resetDatabase();
            console.log("Database reset successfully, sync will retry later");
          } catch (resetError) {
            console.error("Failed to reset database during sync:", resetError);
          }
        }
        
        syncStore.setSyncing("task", false);
        // Don't update state - keep using local data
      }
    },
  }))
);

// Computed selectors for filtered views
export const useFilteredTasks = () => {
  const { tasks, activeCategory } = useTodoStore();
  
  if (!activeCategory || activeCategory === "all") return tasks;
  if (activeCategory === "completed") return tasks.filter(t => t.completed);
  return tasks.filter(t => t.category === activeCategory);
};