import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "../stores/auth.store";
import { useAppStore } from "../stores/app.store";
import { useDockStore } from "../stores/dock.store";
import { useBackgroundStore } from "../stores/background.store";
import { useGreetingStore, useMantraStore } from "../stores/greetings.store";

export interface MeelioExport {
  version: string;
  exportedAt: number;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  data: {
    tasks: any[];
    notes: any[];
    categories: any[];
    siteBlocker: any[];
    tabStashes: any[];
    focusSessions: any[];
    bookmarks: any[];
  };
  settings: {
    app: {
      mantraRotationEnabled: boolean;
      wallpaperRotationEnabled: boolean;
      twelveHourClock: boolean;
      confettiOnComplete: boolean;
    };
    dock: {
      dockIconsVisible: Record<string, boolean>;
      showIconLabels: boolean;
    };
    background: {
      selectedBackground: any;
    };
    greetings: {
      customGreeting: string | null;
      customMantra: string | null;
    };
  };
}

export async function exportAllData(): Promise<MeelioExport> {
  const authState = useAuthStore.getState();
  const appState = useAppStore.getState();
  const dockState = useDockStore.getState();
  const backgroundState = useBackgroundStore.getState();
  const greetingState = useGreetingStore.getState();
  const mantraState = useMantraStore.getState();

  const user = authState.user;
  const guestUser = authState.guestUser;
  const userId = user?.id || guestUser?.id;

  let tasks: any[] = [];
  let notes: any[] = [];
  let categories: any[] = [];
  let siteBlocker: any[] = [];
  let tabStashes: any[] = [];
  let focusSessions: any[] = [];
  let bookmarks: any[] = [];

  if (userId) {
    tasks = await db.tasks
      .where("userId")
      .equals(userId)
      .filter((t) => !t.deletedAt)
      .toArray();

    notes = await db.notes
      .where("userId")
      .equals(userId)
      .filter((n) => !n.deletedAt)
      .toArray();

    categories = await db.categories
      .where("userId")
      .equals(userId)
      .filter((c) => !c.deletedAt)
      .toArray();

    siteBlocker = await db.siteBlocker
      .where("userId")
      .equals(userId)
      .filter((s) => !s.deletedAt)
      .toArray();

    tabStashes = await db.tabStashes
      .where("userId")
      .equals(userId)
      .filter((t) => !t.deletedAt)
      .toArray();

    focusSessions = await db.focusSessions
      .where("userId")
      .equals(userId)
      .toArray();

    bookmarks = await db.bookmarks
      .where("userId")
      .equals(userId)
      .toArray();
  }

  return {
    version: "1.0.0",
    exportedAt: Date.now(),
    user: user
      ? {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        }
      : null,
    data: {
      tasks,
      notes,
      categories,
      siteBlocker,
      tabStashes,
      focusSessions,
      bookmarks,
    },
    settings: {
      app: {
        mantraRotationEnabled: appState.mantraRotationEnabled,
        wallpaperRotationEnabled: appState.wallpaperRotationEnabled,
        twelveHourClock: appState.twelveHourClock,
        confettiOnComplete: appState.confettiOnComplete,
      },
      dock: {
        dockIconsVisible: dockState.dockIconsVisible,
        showIconLabels: dockState.showIconLabels,
      },
      background: {
        selectedBackground: backgroundState.selectedBackground,
      },
      greetings: {
        customGreeting: greetingState.customGreeting,
        customMantra: mantraState.customMantra,
      },
    },
  };
}

export function downloadExport(data: MeelioExport): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split("T")[0];
  const filename = `meelio-backup-${date}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateImport(data: unknown): data is MeelioExport {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== "string") return false;
  if (typeof obj.exportedAt !== "number") return false;
  if (!obj.data || typeof obj.data !== "object") return false;

  const dataObj = obj.data as Record<string, unknown>;
  if (!Array.isArray(dataObj.tasks)) return false;
  if (!Array.isArray(dataObj.notes)) return false;

  return true;
}

export async function importAllData(data: MeelioExport): Promise<void> {
  const authState = useAuthStore.getState();
  const user = authState.user;
  const guestUser = authState.guestUser;
  const userId = user?.id || guestUser?.id;

  if (!userId) {
    throw new Error("No user session found");
  }

  if (data.data.tasks && data.data.tasks.length > 0) {
    for (const task of data.data.tasks) {
      const existingTask = await db.tasks.get(task.id);
      if (!existingTask) {
        await db.tasks.add({
          ...task,
          userId,
          deletedAt: null,
        });
      }
    }
  }

  if (data.data.notes && data.data.notes.length > 0) {
    for (const note of data.data.notes) {
      const existingNote = await db.notes.get(note.id);
      if (!existingNote) {
        await db.notes.add({
          ...note,
          userId,
          deletedAt: null,
        });
      }
    }
  }

  if (data.data.categories && data.data.categories.length > 0) {
    for (const category of data.data.categories) {
      const existingCategory = await db.categories.get(category.id);
      if (!existingCategory) {
        await db.categories.add({
          ...category,
          userId,
          deletedAt: null,
        });
      }
    }
  }

  if (data.data.siteBlocker && data.data.siteBlocker.length > 0) {
    for (const site of data.data.siteBlocker) {
      const existingSite = await db.siteBlocker.get(site.id);
      if (!existingSite) {
        await db.siteBlocker.add({
          ...site,
          userId,
          deletedAt: null,
        });
      }
    }
  }

  if (data.data.tabStashes && data.data.tabStashes.length > 0) {
    for (const stash of data.data.tabStashes) {
      const existingStash = await db.tabStashes.get(stash.id);
      if (!existingStash) {
        await db.tabStashes.add({
          ...stash,
          userId,
          deletedAt: null,
        });
      }
    }
  }

  if (data.data.focusSessions && data.data.focusSessions.length > 0) {
    for (const session of data.data.focusSessions) {
      const existingSession = await db.focusSessions.get(session.id);
      if (!existingSession) {
        await db.focusSessions.add({
          ...session,
          userId,
        });
      }
    }
  }

  if (data.data.bookmarks && data.data.bookmarks.length > 0) {
    for (const bookmark of data.data.bookmarks) {
      const existingBookmark = await db.bookmarks.get(bookmark.id);
      if (!existingBookmark) {
        await db.bookmarks.add({
          ...bookmark,
          userId,
        });
      }
    }
  }

  if (data.settings) {
    const appStore = useAppStore.getState();
    const dockStore = useDockStore.getState();
    const backgroundStore = useBackgroundStore.getState();
    const greetingStore = useGreetingStore.getState();
    const mantraStore = useMantraStore.getState();

    if (data.settings.app) {
      appStore.setMantraRotation(data.settings.app.mantraRotationEnabled);
      appStore.setWallpaperRotationEnabled(
        data.settings.app.wallpaperRotationEnabled
      );
      appStore.setTwelveHourClock(data.settings.app.twelveHourClock);
      appStore.setConfettiOnComplete(data.settings.app.confettiOnComplete);
    }

    if (data.settings.dock) {
      dockStore.setShowIconLabels(data.settings.dock.showIconLabels);
      if (data.settings.dock.dockIconsVisible) {
        for (const [key, value] of Object.entries(
          data.settings.dock.dockIconsVisible
        )) {
          dockStore.setDockIconVisible(key as any, value);
        }
      }
    }

    if (data.settings.background?.selectedBackground) {
      backgroundStore.setSelectedBackground(
        data.settings.background.selectedBackground
      );
    }

    if (data.settings.greetings) {
      if (data.settings.greetings.customGreeting) {
        greetingStore.setCustomGreeting(data.settings.greetings.customGreeting);
      }
      if (data.settings.greetings.customMantra) {
        mantraStore.setCustomMantra(data.settings.greetings.customMantra);
      }
    }
  }
}
