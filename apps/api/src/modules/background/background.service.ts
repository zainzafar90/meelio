import { db } from "@/db";
import { backgrounds } from "@/db/schema";
import { eq } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

/**
 * Background service for handling background operations
 * This follows the singleton pattern to ensure only one instance exists
 */
export class BackgroundService {
  // Singleton instance
  private static instance: BackgroundService;

  private constructor() {}

  /**
   * Get the singleton instance of the background service
   * @returns {BackgroundService} The background service instance
   */
  public static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  /**
   * Get all backgrounds for a user
   * @param {string} userId - The user ID
   * @returns {Promise<object[]>} The backgrounds
   */
  async getBackgrounds(userId: string) {
    const userBackgrounds = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.userId, userId));

    return userBackgrounds;
  }

  /**
   * Get a background by ID
   * @param {string} id - The background ID
   * @returns {Promise<object|null>} The background or null if not found
   */
  async getBackgroundById(id: string) {
    const background = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.id, id));

    if (background.length === 0) {
      return null;
    }

    return background[0];
  }

  /**
   * Create a new background
   * @param {string} userId - The user ID
   * @param {object} backgroundData - The background data
   * @returns {Promise<object>} The created background
   */
  async createBackground(userId: string, backgroundData: any) {
    const result = await db
      .insert(backgrounds)
      .values({
        userId,
        ...backgroundData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Update a background
   * @param {string} id - The background ID
   * @param {object} backgroundData - The background data to update
   * @returns {Promise<object>} The updated background
   */
  async updateBackground(id: string, backgroundData: any) {
    const background = await this.getBackgroundById(id);

    if (!background) {
      throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
    }

    const result = await db
      .update(backgrounds)
      .set({
        ...backgroundData,
        updatedAt: new Date(),
      })
      .where(eq(backgrounds.id, id))
      .returning();

    return result[0];
  }

  /**
   * Delete a background
   * @param {string} id - The background ID
   * @returns {Promise<void>}
   */
  async deleteBackground(id: string) {
    const background = await this.getBackgroundById(id);

    if (!background) {
      throw new ApiError(httpStatus.NOT_FOUND, "Background not found");
    }

    await db.delete(backgrounds).where(eq(backgrounds.id, id));
  }
}

// Export the background service instance
export const backgroundService = BackgroundService.getInstance();
