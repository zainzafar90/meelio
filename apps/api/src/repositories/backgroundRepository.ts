import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { backgrounds } from "../db/schema/background.schema";
import { defaultBackgrounds } from "../modules/background/data/default-backgrounds";

export class BackgroundRepository {
  async getBackgroundsForUser(userId: string) {
    // First get user's custom backgrounds
    const userBackgrounds = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.userId, userId));

    // Merge with default backgrounds, marking user's backgrounds as custom
    const allBackgrounds = [
      ...defaultBackgrounds.map((bg) => ({ ...bg, isDefault: true })),
      ...userBackgrounds.map((bg) => ({ ...bg, isDefault: false })),
    ];

    return allBackgrounds;
  }

  async getBackground(id: string, userId: string) {
    // First check user's custom backgrounds
    const userBackground = await db
      .select()
      .from(backgrounds)
      .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, userId)))
      .limit(1);

    if (userBackground.length > 0) {
      return { ...userBackground[0], isDefault: false };
    }

    // If not found, check default backgrounds
    const defaultBackground = defaultBackgrounds.find((bg) => bg.id === id);
    if (defaultBackground) {
      return { ...defaultBackground, isDefault: true };
    }

    return null;
  }

  async createBackground(data: typeof backgrounds.$inferInsert) {
    const [background] = await db.insert(backgrounds).values(data).returning();

    return { ...background, isDefault: false };
  }

  async updateBackground(
    id: string,
    userId: string,
    data: Partial<typeof backgrounds.$inferInsert>
  ) {
    // Only allow updating custom backgrounds
    const [background] = await db
      .update(backgrounds)
      .set(data)
      .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, userId)))
      .returning();

    return background ? { ...background, isDefault: false } : null;
  }

  async deleteBackground(id: string, userId: string) {
    // Only allow deleting custom backgrounds
    const [background] = await db
      .delete(backgrounds)
      .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, userId)))
      .returning();

    return background ? { ...background, isDefault: false } : null;
  }
}
