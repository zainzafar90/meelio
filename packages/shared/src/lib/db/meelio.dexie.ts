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
      // MeelioDB tables
      siteBlocker: "id, userId, url",
      backgrounds: "id, userId, type, *tags",

      // Task table with simplified schema
      tasks: "id, userId, completed, category, dueDate, createdAt",

      // PomodoroDB tables
      pomodoroState: "++id, lastUpdated",
      focusSessions: "++id, timestamp",
      focusStats: "++id, date",
    });
  }

  // MeelioDB methods
  async getSelectedBackground(): Promise<Backgrounds | undefined> {
    return this.backgrounds.filter((bg) => bg.isFavourite).first();
  }

  async setFavouriteBackground(backgroundId: string): Promise<void> {
    await this.transaction("rw", this.backgrounds, async () => {
      // Clear previous selection
      await this.backgrounds
        .filter((bg) => bg.isFavourite)
        .modify((bg) => {
          bg.isFavourite = false;
        });
      // Set new selection
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

// Initialize with default selected background if none exists
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