import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "../stores/auth.store";
import { useTaskStore } from "../stores/task.store";
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
  categories: MigrationResult;
}

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

    await db.transaction("rw", db.tasks, async () => {
      for (const task of guestTasks) {
        await db.tasks.update(task.id, {
          userId: authenticatedUserId,
          updatedAt: Date.now(),
        });
      }
    });

    const taskStore = useTaskStore.getState();
    await taskStore.loadFromLocal();

    return { success: true, migratedCount: guestTasks.length };
  } catch (error) {
    console.error("Failed to migrate guest tasks:", error);
    return { success: false, migratedCount: 0, error };
  }
};

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

    await db.transaction("rw", db.categories, async () => {
      for (const cat of guestCategories) {
        await db.categories.update(cat.id, {
          userId: authenticatedUserId,
          updatedAt: Date.now(),
        });
      }
    });

    return { success: true, migratedCount: guestCategories.length };
  } catch (error) {
    console.error("Failed to migrate guest categories:", error);
    return { success: false, migratedCount: 0, error };
  }
};

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

  summary.tasks = await migrateGuestTasks(guestUserId, authenticatedUserId);
  summary.categories = await migrateGuestCategories(guestUserId, authenticatedUserId);
  summary.pomodoro = await migrateGuestPomodoroSessions();

  summary.success = summary.tasks.success && summary.categories.success && summary.pomodoro.success;

  return summary;
};

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

export const cleanupGuestData = async (guestUserId: string) => {
  try {
    await db.tasks.where("userId").equals(guestUserId).delete();
    await db.categories.where("userId").equals(guestUserId).delete();

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
