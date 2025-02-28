import Dexie, { Table } from "dexie";
import type {
  SiteBlocker,
  Backgrounds,
  TodoList,
  Task,
  PomodoroSession,
  DailySummary,
} from "./models.dexie";

// Initial Todo lists
export const initialLists: TodoList[] = [
  {
    id: "all",
    name: "All Tasks",
    icon: "ListTodo",
    emoji: "📋",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "completed",
    name: "Completed",
    icon: "CheckSquare",
    emoji: "✅",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "today",
    name: "Today",
    icon: "Calendar",
    emoji: "📅",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "personal",
    name: "Personal",
    icon: "User",
    emoji: "👤",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "work",
    name: "Work",
    icon: "Briefcase",
    emoji: "💼",
    type: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export class MeelioDB extends Dexie {
  // MeelioDB tables
  siteBlocker!: Table<SiteBlocker, string>;
  backgrounds!: Table<Backgrounds>;

  // TodoDB tables
  tasks!: Table<Task>;
  lists!: Table<TodoList>;

  // PomodoroDB tables
  focusSessions!: Table<PomodoroSession>;
  focusStats!: Table<DailySummary>;

  constructor() {
    super("meelio");

    this.version(1).stores({
      // MeelioDB tables
      siteBlocker: ["id", "_syncStatus", "_lastModified", "userId", "url"].join(
        ","
      ),
      backgrounds: "++id, userId, type, *tags",

      // TodoDB tables
      tasks: "id, listId, completed, date, createdAt, updatedAt",
      lists: "id, type, createdAt, updatedAt",

      // PomodoroDB tables
      pomodoroState: "++id, lastUpdated",
      focusSessions: "++id, timestamp",
      focusStats: "++id, date",
    });

    // Initialize Todo lists
    this.on("populate", () => {
      this.lists.bulkAdd(initialLists);
    });
  }

  // MeelioDB methods
  async getSelectedBackground(): Promise<Backgrounds | undefined> {
    return this.backgrounds.filter((bg) => bg.isSelected).first();
  }

  async setSelectedBackground(backgroundId: string): Promise<void> {
    await this.transaction("rw", this.backgrounds, async () => {
      // Clear previous selection
      await this.backgrounds
        .filter((bg) => bg.isSelected)
        .modify((bg) => {
          bg.isSelected = false;
        });
      // Set new selection
      await this.backgrounds
        .where("id")
        .equals(backgroundId)
        .modify((bg) => {
          bg.isSelected = true;
        });
    });
  }
}

export const db = new MeelioDB();

// Initialize with default selected background if none exists
db.on("ready", async () => {
  const selected = await db.getSelectedBackground();
  if (!selected) {
    const defaultBackground = await db.backgrounds
      .filter((bg) => bg.isDefault)
      .first();

    if (defaultBackground) {
      await db.setSelectedBackground(defaultBackground.id);
    }
  }

  // Ensure system lists exist
  await ensureSystemLists();
});

// Add a function to ensure system lists exist
export const ensureSystemLists = async () => {
  const existingLists = await db.lists.where("type").equals("system").toArray();
  const existingListIds = existingLists.map((list) => list.id);

  const missingLists = initialLists.filter(
    (list) => !existingListIds.includes(list.id)
  );

  if (missingLists.length > 0) {
    await db.lists.bulkAdd(missingLists);
  }
};
