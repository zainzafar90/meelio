import Dexie, { Table } from "dexie";
import type {
  SiteBlocker,
  Backgrounds,
  Task,
  PomodoroSession,
  DailySummary,
} from "./models.dexie";

export class MeelioDB extends Dexie {
  // MeelioDB tables
  siteBlocker!: Table<SiteBlocker, string>;
  backgrounds!: Table<Backgrounds>;

  // Task table
  tasks!: Table<Task>;

  // PomodoroDB tables
  focusSessions!: Table<PomodoroSession>;
  focusStats!: Table<DailySummary>;

  constructor() {
    super("meelio");

    this.version(1).stores({
      siteBlocker: "id, userId, url",
      backgrounds: "id, userId, type, *tags",

      tasks: "id, userId, category, dueDate, createdAt",

      pomodoroState: "++id, lastUpdated",
      focusSessions: "++id, timestamp",
      focusStats: "++id, date",
    });

    this.version(2)
      .stores({
        siteBlocker: "id, userId, url",
        backgrounds: "id, userId, type, *tags",

        tasks: "id, userId, completed, category, dueDate, createdAt",

        pomodoroState: "++id, lastUpdated",
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
  }

  async getSelectedBackground(): Promise<Backgrounds | undefined> {
    return this.backgrounds.filter((bg) => bg.isFavourite).first();
  }

  async setFavouriteBackground(backgroundId: string): Promise<void> {
    await this.transaction("rw", this.backgrounds, async () => {
      await this.backgrounds
        .filter((bg) => bg.isFavourite)
        .modify((bg) => {
          bg.isFavourite = false;
        });
      await this.backgrounds
        .where("id")
        .equals(backgroundId)
        .modify((bg) => {
          bg.isFavourite = true;
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
  const selected = await db.getSelectedBackground();
  if (!selected) {
    const allBackgrounds = await db.backgrounds.toArray();
    const defaultBackground = allBackgrounds[0];

    if (defaultBackground) {
      await db.setFavouriteBackground(defaultBackground.id);
    }
  }
});
