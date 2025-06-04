import Dexie, { Table } from "dexie";
import type {
  SiteBlocker,
  Task,
  PomodoroSession,
  DailySummary,
} from "./models.dexie";

export class MeelioDB extends Dexie {
  siteBlocker!: Table<SiteBlocker, string>;
  tasks!: Table<Task>;
  focusSessions!: Table<PomodoroSession>;
  focusStats!: Table<DailySummary>;

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
  }
}

export const db = new MeelioDB();

export async function resetDatabase() {
  try {
    await db.delete();
    console.log("Database deleted successfully");
    await db.open();
    console.log("Database recreated with latest schema");
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
}

db.on("ready", async () => {
  console.log("Database ready");
});
