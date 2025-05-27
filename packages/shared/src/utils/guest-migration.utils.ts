import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "../stores/auth.store";
import { useTodoStore } from "../stores/todo.store";
import { useSimpleSyncStore } from "../stores/simple-sync.store";

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  error?: any;
}

interface MigrationSummary {
  success: boolean;
  tasks: MigrationResult;
  // Future migrations can be added here
  // pomodoro: MigrationResult;
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

    const syncStore = useSimpleSyncStore.getState();

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

    const todoStore = useTodoStore.getState();
    
    // Reload tasks and trigger sync
    await todoStore.loadFromLocal();
    
    // If online, sync immediately
    if (syncStore.isOnline) {
      await todoStore.syncWithServer();
    }

    return { success: true, migratedCount: guestTasks.length };
  } catch (error) {
    console.error("Failed to migrate guest tasks:", error);
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
  };

  // Migrate tasks
  summary.tasks = await migrateGuestTasks(guestUserId, authenticatedUserId);
  
  // Future migrations can be added here
  // summary.pomodoro = await migrateGuestPomodoroSessions(guestUserId, authenticatedUserId);
  // summary.settings = await migrateGuestSettings(guestUserId, authenticatedUserId);
  
  // Overall success is true only if all migrations succeed
  summary.success = summary.tasks.success;
  
  return summary;
};

/**
 * Clean up guest user data after successful migration
 */
export const cleanupGuestData = async (guestUserId: string) => {
  try {
    await db.tasks.where("userId").equals(guestUserId).delete();

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
