import Dexie, { Table } from "dexie";
import type {
  SiteBlocker,
  Task,
  PomodoroSession,
  DailySummary,
  Category,
  CachedSound,
} from "./models.dexie";

export class MeelioDB extends Dexie {
  siteBlocker!: Table<SiteBlocker, string>;
  tasks!: Table<Task>;
  focusSessions!: Table<PomodoroSession>;
  focusStats!: Table<DailySummary>;
  categories!: Table<Category, string>;
  sounds!: Table<CachedSound, string>;

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
