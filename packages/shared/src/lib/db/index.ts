import Dexie, { Table } from "dexie";
import type { SiteBlocker, Background, QueryCache } from "./models";

export class MeelioDB extends Dexie {
  siteBlocker!: Table<SiteBlocker, string>;
  backgrounds!: Table<Background>;
  queryCache!: Table<QueryCache, string>;

  constructor() {
    super("meelio");

    this.version(1).stores({
      siteBlocker: ["id", "_syncStatus", "_lastModified", "userId", "url"].join(
        ","
      ),
      backgrounds: "++id, userId, type, *tags",
      queryCache: "id,timestamp",
    });

    // Convert boolean fields to numbers for indexing
    this.backgrounds.hook("creating", (primKey, obj) => {
      if (obj.isSelected !== undefined) obj.isSelected = obj.isSelected ? 1 : 0;
      if (obj.isDefault !== undefined) obj.isDefault = obj.isDefault ? 1 : 0;
    });

    this.backgrounds.hook("reading", (obj) => {
      if (obj.isSelected !== undefined) obj.isSelected = obj.isSelected === 1;
      if (obj.isDefault !== undefined) obj.isDefault = obj.isDefault === 1;
    });
  }

  async getSelectedBackground(): Promise<Background | undefined> {
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
});
