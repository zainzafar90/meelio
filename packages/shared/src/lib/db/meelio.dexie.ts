import Dexie, { Table } from "dexie";
import type {
  SiteBlocker,
  Task,
  PomodoroSession,
  DailySummary,
  Category,
  CachedSound,
  TabStash,
  CachedBookmark,
  CachedWeather,
} from "./models.dexie";
import type { Note } from "./models.notes";

export class MeelioDB extends Dexie {
  siteBlocker!: Table<SiteBlocker, string>;
  tasks!: Table<Task>;
  focusSessions!: Table<PomodoroSession>;
  focusStats!: Table<DailySummary>;
  categories!: Table<Category, string>;
  sounds!: Table<CachedSound, string>;
  notes!: Table<Note, string>;
  tabStashes!: Table<TabStash, string>;
  bookmarks!: Table<CachedBookmark, string>;
  weather!: Table<CachedWeather, string>;

  constructor() {
    super("meelio");

    this.version(1).stores({
      siteBlocker: "id, userId, url",

      tasks: "id, userId, category, dueDate, createdAt",

      focusSessions: "++id, timestamp",
      focusStats: "++id, date",
    });

    this.version(2)
      .stores({
        siteBlocker: "id, userId, url",

        tasks: "id, userId, completed, category, dueDate, createdAt",

        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
      })
      .upgrade(async (trans) => {
        await trans
          .table("tasks")
          .toCollection()
          .modify((task: any) => {
            delete task.description;
            delete task.is_focus;
            delete task.status;

            if (task.completed === undefined) {
              task.completed = false;
            }
          });
      });

    this.version(3)
      .stores({
        siteBlocker: "id, userId, url",

        tasks: "id, userId, completed, category, dueDate, pinned, createdAt",

        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
      })
      .upgrade(async (trans) => {
        await trans
          .table("tasks")
          .toCollection()
          .modify((task: any) => {
            if (task.pinned === undefined) {
              task.pinned = false;
            }
          });
      });

    this.version(4)
      .stores({
        siteBlocker: "id, userId, url",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name",
      });

    this.version(5)
      .stores({
        siteBlocker: "id, userId, url",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name",
      });

    this.version(6)
      .stores({
        siteBlocker: "id, userId, url",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name, icon, type",
      });

    this.version(7)
      .stores({
        siteBlocker: "id, userId, url",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name, icon, type",
        sounds: "id, path, downloadedAt, lastAccessed",
      });

    this.version(8)
      .stores({
        siteBlocker: "id, userId, url",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt, updatedAt, deletedAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name, icon, type",
        sounds: "id, path, downloadedAt, lastAccessed",
      })
      .upgrade(async (trans) => {
        await trans
          .table("tasks")
          .toCollection()
          .modify((task: any) => {
            if (task.updatedAt === undefined) {
              task.updatedAt = task.createdAt ?? Date.now();
            }
            if (task.deletedAt === undefined) {
              task.deletedAt = null;
            }
          });
      });

    this.version(9)
      .stores({
        siteBlocker: "id, userId, url",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt, updatedAt, deletedAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name, icon, type",
        sounds: "id, path, downloadedAt, lastAccessed",
        notes: "id, userId, categoryId, providerId, createdAt, updatedAt, deletedAt",
      });

    this.version(10)
      .stores({
        siteBlocker: "id, userId, url",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt, updatedAt, deletedAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name, icon, type",
        sounds: "id, path, downloadedAt, lastAccessed",
        notes: "id, userId, categoryId, providerId, createdAt, updatedAt, deletedAt",
        tabStashes: "id, userId, windowId, createdAt, updatedAt, deletedAt",
      });

    this.version(11)
      .stores({
        siteBlocker: "id, userId, url, createdAt, updatedAt, deletedAt",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt, updatedAt, deletedAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name, icon, type",
        sounds: "id, path, downloadedAt, lastAccessed",
        notes: "id, userId, categoryId, providerId, createdAt, updatedAt, deletedAt",
        tabStashes: "id, userId, windowId, createdAt, updatedAt, deletedAt",
      });

    this.version(12)
      .stores({
        siteBlocker: "id, userId, url, createdAt, updatedAt, deletedAt",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt, updatedAt, deletedAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name, icon, type",
        sounds: "id, path, downloadedAt, lastAccessed",
        notes: "id, userId, categoryId, providerId, createdAt, updatedAt, deletedAt",
        tabStashes: "id, userId, windowId, createdAt, updatedAt, deletedAt",
        bookmarks: "id, userId, chromeId, parentId, cachedAt, deletedAt",
      });

    this.version(13)
      .stores({
        siteBlocker: "id, userId, url, createdAt, updatedAt, deletedAt",
        tasks: "id, userId, completed, category, dueDate, pinned, createdAt, updatedAt, deletedAt",
        focusSessions: "++id, timestamp",
        focusStats: "++id, date",
        categories: "id, userId, name, icon, type",
        sounds: "id, path, downloadedAt, lastAccessed",
        notes: "id, userId, categoryId, providerId, createdAt, updatedAt, deletedAt",
        tabStashes: "id, userId, windowId, createdAt, updatedAt, deletedAt",
        bookmarks: "id, userId, chromeId, parentId, cachedAt, deletedAt",
        weather: "id, locationKey, cachedAt",
      });
  }
}

export const db = new MeelioDB();

export async function resetDatabase() {
  try {
    await db.delete();
    await db.open();
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
}

db.on("ready", async () => {
  console.debug("Database ready");
});
