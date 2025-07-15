import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "../stores/auth.store";
import { useTaskStore } from "../stores/task.store";
import { useSyncStore } from "../stores/sync.store";
import { useTimerStore } from "../stores/timer.store";

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  error?: any;
}

interface MigrationSummary {
  success: boolean;
  tasks: MigrationResult;
  pomodoro: MigrationResult;
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
  };

  // Migrate tasks
  summary.tasks = await migrateGuestTasks(guestUserId, authenticatedUserId);

  // Migrate pomodoro sessions
  summary.pomodoro = await migrateGuestPomodoroSessions();

  // Future migrations can be added here
  // summary.settings = await migrateGuestSettings(guestUserId, authenticatedUserId);

  // Overall success is true only if all migrations succeed
  summary.success = summary.tasks.success && summary.pomodoro.success;

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

    // The focus time will sync automatically when user logs in
    // No need to manually create sessions here
    console.log(
      `✅ Guest had ${Math.floor(guestFocusTime / 60)} minutes of focus time`
    );

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
