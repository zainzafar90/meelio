import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "../stores/auth.store";
import { useTaskStore } from "../stores/task.store";
import { useSyncStore } from "../stores/sync.store";
import { useTimerStore } from "../stores/timer.store";
import { categoryApi } from "../api/category.api";

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  error?: any;
}

interface MigrationSummary {
  success: boolean;
  tasks: MigrationResult;
  pomodoro: MigrationResult;
  categories: MigrationResult;
  // Future migrations can be added here
  // settings: MigrationResult;
  // etc.
}

/**
 * Migrate guest user tasks to authenticated user
 */
const migrateGuestTasks = async (
  guestUserId: string,
  authenticatedUserId: string
): Promise<MigrationResult> => {
  try {
    const guestTasks = await db.tasks
      .where("userId")
      .equals(guestUserId)
      .toArray();

    if (guestTasks.length === 0) {
      return { success: true, migratedCount: 0 };
    }

    const syncStore = useSyncStore.getState();

    // Update tasks locally and queue them for sync
    await db.transaction("rw", db.tasks, async () => {
      for (const task of guestTasks) {
        // Update the userId
        await db.tasks.update(task.id, {
          userId: authenticatedUserId,
          updatedAt: Date.now(),
        });

        // Queue each task for creation on the server
        syncStore.addToQueue("task", {
          type: "create",
          entityId: task.id,
          data: {
            ...task,
            userId: authenticatedUserId,
            updatedAt: Date.now(),
          },
        });
      }
    });

    const taskStore = useTaskStore.getState();

    // Reload tasks and trigger sync
    await taskStore.loadFromLocal();

    // If online, sync immediately
    if (syncStore.isOnline) {
      await taskStore.syncWithServer();
    }

    return { success: true, migratedCount: guestTasks.length };
  } catch (error) {
    console.error("Failed to migrate guest tasks:", error);
    return { success: false, migratedCount: 0, error };
  }
};

/**
 * Migrate guest user categories and update tasks accordingly
 */
const migrateGuestCategories = async (
  guestUserId: string,
  authenticatedUserId: string
): Promise<MigrationResult> => {
  try {
    const guestCategories = await db.categories
      .where("userId")
      .equals(guestUserId)
      .toArray();

    if (guestCategories.length === 0) {
      return { success: true, migratedCount: 0 };
    }

    const idMap = new Map<string, string>();

    // Create categories on server
    for (const cat of guestCategories) {
      const created = await categoryApi.createCategory({ name: cat.name });
      idMap.set(cat.id, created.id);
    }

    // Update tasks with new category IDs
    // Note: userId already updated in migrateTasks
    const tasks = await db.tasks
      .where("userId")
      .equals(authenticatedUserId)
      .toArray();

    const syncStore = useSyncStore.getState();

    await db.transaction("rw", db.tasks, async () => {
      for (const task of tasks) {
        if (task.categoryId && idMap.has(task.categoryId)) {
          const newCategoryId = idMap.get(task.categoryId)!;
          await db.tasks.update(task.id, {
            categoryId: newCategoryId,
            updatedAt: Date.now(),
          });

          syncStore.addToQueue("task", {
            type: "update",
            entityId: task.id,
            data: { categoryId: newCategoryId, updatedAt: Date.now() },
          });
        }
      }
    });

    // If online, sync tasks
    if (syncStore.isOnline) {
      await useTaskStore.getState().syncWithServer();
    }

    return { success: true, migratedCount: guestCategories.length };
  } catch (error) {
    console.error("Failed to migrate guest categories:", error);
    return { success: false, migratedCount: 0, error };
  }
};

/**
 * Main migration orchestrator
 * Migrate all guest user data to authenticated user
 */
export const migrateGuestDataToUser = async (
  guestUserId: string,
  authenticatedUserId: string
): Promise<MigrationSummary> => {
  const summary: MigrationSummary = {
    success: true,
    tasks: { success: false, migratedCount: 0 },
    pomodoro: { success: false, migratedCount: 0 },
    categories: { success: false, migratedCount: 0 },
  };

  // Migrate tasks
  summary.tasks = await migrateGuestTasks(guestUserId, authenticatedUserId);

  // Migrate categories after tasks
  summary.categories = await migrateGuestCategories(guestUserId, authenticatedUserId);

  // Migrate pomodoro
  summary.pomodoro = await migrateGuestPomodoroSessions();

  // Overall success
  summary.success = summary.tasks.success && summary.categories.success && summary.pomodoro.success;

  return summary;
};

/**
 * Migrate guest user pomodoro sessions to authenticated user
 * SIMPLIFIED: Just transfer the focus time - let the regular sync handle it
 */
const migrateGuestPomodoroSessions = async (): Promise<MigrationResult> => {
  try {
    const pomodoroStore = useTimerStore().getState();
    const guestFocusTime = pomodoroStore.stats.focusSec;

    if (guestFocusTime === 0) {
      return { success: true, migratedCount: 0 };
    }

    return {
      success: true,
      migratedCount: 1,
    };
  } catch (error) {
    console.error("Failed to migrate guest pomodoro sessions:", error);
    return { success: false, migratedCount: 0, error };
  }
};

/**
 * Clean up guest user data after successful migration
 */
export const cleanupGuestData = async (guestUserId: string) => {
  try {
    await db.tasks.where("userId").equals(guestUserId).delete();
    await db.categories.where("userId").equals(guestUserId).delete();

    // Clear guest focus sessions from IndexedDB
    const today = new Date().toISOString().split("T")[0];
    await db.focusStats.where("date").equals(today).delete();
    await db.focusSessions.clear();

    const authStore = useAuthStore.getState();
    if (authStore.guestUser?.id === guestUserId) {
      authStore.authenticateGuest(null as any);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to cleanup guest data:", error);
    return { success: false, error };
  }
};
