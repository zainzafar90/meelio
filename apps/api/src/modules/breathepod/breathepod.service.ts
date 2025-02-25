import { db } from "@/db";
import { breathepod, type BreathepodInsert } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get breathepod for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object|null>} The breathepod or null if not found
 */
export const getBreathepod = async (userId: string) => {
  const result = await db
    .select()
    .from(breathepod)
    .where(eq(breathepod.userId, userId));

  if (result.length === 0) {
    return null;
  }

  return result[0];
};

/**
 * Create or update breathepod for a user
 * @param {string} userId - The user ID
 * @param {object} data - The breathepod data containing config
 * @returns {Promise<object>} The created or updated breathepod
 */
export const createOrUpdateBreathepod = async (
  userId: string,
  data: { config: any }
) => {
  // Check if breathepod already exists
  const existingBreathepod = await getBreathepod(userId);

  if (existingBreathepod) {
    // Update existing breathepod
    const result = await db
      .update(breathepod)
      .set({
        updatedAt: new Date(),
      } as any)
      .where(eq(breathepod.userId, userId))
      .returning();

    return result[0];
  } else {
    // Create new breathepod
    const insertData: BreathepodInsert = {
      userId,
    } as any;

    if (data.config) {
      (insertData as any).config = data.config;
    }

    const result = await db.insert(breathepod).values(insertData).returning();

    return result[0];
  }
};
